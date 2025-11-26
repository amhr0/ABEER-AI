import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * تنفيذ أمر SSH على السيرفر
 */
export async function executeSSHCommand(params: {
  host: string;
  port: number;
  user: string;
  command: string;
  privateKey?: string;
}): Promise<{ stdout: string; stderr: string }> {
  const { host, port, user, command, privateKey } = params;

  // قائمة الأوامر المسموحة (whitelist)
  const allowedCommands = [
    "ls",
    "cat",
    "tail",
    "head",
    "ps",
    "top",
    "df",
    "free",
    "uptime",
    "whoami",
    "pwd",
    "date",
    "uname",
    "hostname",
    "git",
    "npm",
    "node",
    "python",
    "python3",
    "systemctl status",
    "nginx -t",
  ];

  // التحقق من أن الأمر مسموح به
  const isAllowed = allowedCommands.some((allowed) => command.trim().startsWith(allowed));
  if (!isAllowed) {
    throw new Error(`الأمر غير مسموح به: ${command.split(" ")[0]}`);
  }

  try {
    // تنفيذ الأمر عبر SSH
    const sshCommand = privateKey
      ? `ssh -i /tmp/ssh_key -p ${port} -o StrictHostKeyChecking=no ${user}@${host} "${command}"`
      : `ssh -p ${port} -o StrictHostKeyChecking=no ${user}@${host} "${command}"`;

    const { stdout, stderr } = await execAsync(sshCommand, {
      timeout: 30000, // 30 seconds timeout
    });

    return { stdout, stderr };
  } catch (error: any) {
    console.error("[SSH] Command execution failed:", error);
    throw new Error(`فشل تنفيذ الأمر: ${error.message}`);
  }
}

/**
 * الحصول على معلومات حالة السيرفر
 */
export async function getServerStatus(params: {
  host: string;
  port: number;
  user: string;
  privateKey?: string;
}): Promise<{
  cpu: string;
  memory: string;
  disk: string;
  uptime: string;
}> {
  try {
    // CPU usage
    const cpuCommand = "top -bn1 | grep 'Cpu(s)' | awk '{print $2}'";
    const cpuResult = await executeSSHCommand({ ...params, command: cpuCommand });

    // Memory usage
    const memCommand = "free -m | awk 'NR==2{printf \"%.2f%%\", $3*100/$2 }'";
    const memResult = await executeSSHCommand({ ...params, command: memCommand });

    // Disk usage
    const diskCommand = "df -h / | awk 'NR==2{print $5}'";
    const diskResult = await executeSSHCommand({ ...params, command: diskCommand });

    // Uptime
    const uptimeCommand = "uptime -p";
    const uptimeResult = await executeSSHCommand({ ...params, command: uptimeCommand });

    return {
      cpu: cpuResult.stdout.trim() || "N/A",
      memory: memResult.stdout.trim() || "N/A",
      disk: diskResult.stdout.trim() || "N/A",
      uptime: uptimeResult.stdout.trim() || "N/A",
    };
  } catch (error) {
    console.error("[SSH] Failed to get server status:", error);
    throw error;
  }
}

/**
 * قراءة محتوى ملف من السيرفر
 */
export async function readServerFile(params: {
  host: string;
  port: number;
  user: string;
  filePath: string;
  privateKey?: string;
}): Promise<string> {
  const { filePath, ...sshParams } = params;

  // التحقق من أن المسار آمن
  if (filePath.includes("..") || filePath.includes("~")) {
    throw new Error("مسار الملف غير آمن");
  }

  const command = `cat ${filePath}`;
  const result = await executeSSHCommand({ ...sshParams, command });

  return result.stdout;
}

/**
 * قائمة الملفات في مجلد
 */
export async function listServerFiles(params: {
  host: string;
  port: number;
  user: string;
  directory: string;
  privateKey?: string;
}): Promise<string[]> {
  const { directory, ...sshParams } = params;

  // التحقق من أن المسار آمن
  if (directory.includes("..")) {
    throw new Error("مسار المجلد غير آمن");
  }

  const command = `ls -la ${directory}`;
  const result = await executeSSHCommand({ ...sshParams, command });

  return result.stdout.split("\n").filter((line) => line.trim() !== "");
}
