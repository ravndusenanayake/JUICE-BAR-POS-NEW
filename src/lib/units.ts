export type BaseUnit = "g" | "ml" | "pcs"

export interface UnitConfig {
  baseUnit: BaseUnit
  displayUnit: string
  conversionFactor: number // How many base units make 1 display unit
  threshold: number // When to switch from base to display unit
}

export const UNIT_CONFIGS: Record<BaseUnit, UnitConfig> = {
  "g": {
    baseUnit: "g",
    displayUnit: "Kg",
    conversionFactor: 1000,
    threshold: 1000 // 1000g -> 1 Kg
  },
  "ml": {
    baseUnit: "ml",
    displayUnit: "L",
    conversionFactor: 1000,
    threshold: 1000 // 1000ml -> 1 L
  },
  "pcs": {
    baseUnit: "pcs",
    displayUnit: "pcs",
    conversionFactor: 1,
    threshold: 0
  }
}

/**
 * Smartly formats a base unit value for human readability.
 * E.g. formatStockDisplay(1500, "g") -> "1.5 Kg"
 * E.g. formatStockDisplay(400, "g") -> "400 g"
 */
export function formatStockDisplay(amount: number, baseUnit: BaseUnit): string {
  const config = UNIT_CONFIGS[baseUnit]
  
  if (!config) return `${amount} ${baseUnit}`

  if (amount >= config.threshold && config.conversionFactor > 1) {
    const converted = amount / config.conversionFactor
    // If it's a whole number, don't show decimals
    return `${Number.isInteger(converted) ? converted : converted.toFixed(2)} ${config.displayUnit}`
  }

  return `${amount} ${baseUnit}`
}

/**
 * Converts a human input (e.g. 1.5 Kg) to base unit (1500 g)
 */
export function toBaseUnit(amount: number, isDisplayUnit: boolean, baseUnit: BaseUnit): number {
  if (!isDisplayUnit) return amount
  const config = UNIT_CONFIGS[baseUnit]
  if (!config) return amount
  return amount * config.conversionFactor
}
