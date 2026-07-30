import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl font-bold whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-orange-500/50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4.5",
  {
    variants: {
      variant: {
        default: "bg-orange-500 text-white hover:bg-orange-600 shadow-md shadow-orange-500/20 active:bg-orange-700 font-bold",
        outline:
          "border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-bold shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700",
        secondary:
          "bg-gray-100 text-gray-900 hover:bg-gray-200 font-bold dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
        ghost:
          "hover:bg-gray-100 text-gray-700 hover:text-gray-900 font-bold dark:hover:bg-gray-800 dark:text-gray-300 dark:hover:text-white",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-600/20 font-bold",
        success:
          "bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-600/20 font-bold",
        link: "text-orange-600 underline-offset-4 hover:underline font-bold",
      },
      size: {
        default: "h-11 px-5 py-2 text-sm gap-2 rounded-xl",
        xs: "h-7 px-2.5 text-xs gap-1 rounded-lg",
        sm: "h-9 px-3.5 text-xs gap-1.5 rounded-lg",
        lg: "h-12 px-6 text-base gap-2 rounded-xl",
        xl: "h-14 px-8 text-lg gap-2.5 rounded-2xl",
        icon: "size-11 rounded-xl",
        "icon-xs": "size-7 rounded-lg",
        "icon-sm": "size-9 rounded-lg",
        "icon-lg": "size-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
