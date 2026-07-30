export interface AuditLog {
  id: string
  timestamp: string
  user: string
  branch: string
  action: string
  category: "Login" | "Product" | "Inventory" | "Wastage" | "Sales" | "User Management" | "Other"
  ipAddress: string
}

export const logAudit = (
  user: string,
  branch: string,
  action: string,
  category: AuditLog["category"]
) => {
  try {
    const logsStr = localStorage.getItem("mock_audit_logs")
    const logs: AuditLog[] = logsStr ? JSON.parse(logsStr) : []
    
    // In a real app, the IP would come from the server request headers.
    // Here we generate a mock IP or use a static one for demo purposes.
    const mockIp = "192.168.1." + Math.floor(Math.random() * 255)

    const newLog: AuditLog = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      timestamp: new Date().toISOString(),
      user: user || "System",
      branch: branch || "Global",
      action,
      category,
      ipAddress: mockIp
    }

    // Prepend so newest is first
    localStorage.setItem("mock_audit_logs", JSON.stringify([newLog, ...logs]))
  } catch (error) {
    console.error("Failed to write audit log:", error)
  }
}
