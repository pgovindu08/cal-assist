"use client"

import * as React from "react"
import { useRef } from "react"
import { cn } from "@/lib/utils"

interface DockProps {
  className?: string
  children: React.ReactNode
  maxAdditionalSize?: number
  iconSize?: number
}

interface DockIconProps {
  className?: string
  src?: string
  href?: string
  name: string
  handleIconHover?: (e: React.MouseEvent<HTMLLIElement>) => void
  children?: React.ReactNode
  iconSize?: number
}

type ScaleValueParams = [number, number]

export const scaleValue = function (
  value: number,
  from: ScaleValueParams,
  to: ScaleValueParams
): number {
  const scale = (to[1] - to[0]) / (from[1] - from[0])
  const capped = Math.min(from[1], Math.max(from[0], value)) - from[0]
  return Math.floor(capped * scale + to[0])
}

export function DockIcon({
  className,
  src,
  href = "#",
  name,
  handleIconHover,
  children,
  iconSize = 55,
}: DockIconProps) {
  const ref = useRef<HTMLLIElement | null>(null)

  return (
    <li
      ref={ref}
      style={
        {
          transition: "width 150ms cubic-bezier(0.25, 1, 0.5, 1), height 150ms cubic-bezier(0.25, 1, 0.5, 1), margin-top 150ms cubic-bezier(0.25, 1, 0.5, 1)",
          "--icon-size": `${iconSize}px`,
        } as React.CSSProperties
      }
      onMouseMove={handleIconHover}
      className={cn(
        "dock-icon group/li flex cursor-pointer items-center justify-center [&_img]:object-contain",
        className
      )}
    >
      <a
        href={href}
        onClick={(e) => e.preventDefault()}
        className="group/a relative aspect-square w-full rounded-[10px] p-1.5 flex items-center justify-center"
        style={{
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "rgba(255,255,255,0.05) 0px 1px 0px inset, 0 4px 16px rgba(0,0,0,0.3)",
        }}
      >
        <span
          className="absolute whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity duration-200 group-hover/li:opacity-100 pointer-events-none"
          style={{
            top: "-36px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(20,22,40,0.95)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(8px)",
          }}
        >
          {name}
        </span>
        {src ? (
          <img src={src} alt={name} className="h-full w-full rounded-[inherit]" />
        ) : (
          children
        )}
      </a>
    </li>
  )
}

export function Dock({
  className,
  children,
  maxAdditionalSize = 5,
  iconSize = 55,
}: DockProps) {
  const dockRef = useRef<HTMLDivElement | null>(null)

  const handleIconHover = (e: React.MouseEvent<HTMLLIElement>) => {
    if (!dockRef.current) return
    const mousePos = e.clientX
    const iconPosLeft = e.currentTarget.getBoundingClientRect().left
    const iconWidth = e.currentTarget.getBoundingClientRect().width

    const cursorDistance = (mousePos - iconPosLeft) / iconWidth
    const offsetPixels = scaleValue(
      cursorDistance,
      [0, 1],
      [maxAdditionalSize * -1, maxAdditionalSize]
    )

    dockRef.current.style.setProperty("--dock-offset-left", `${offsetPixels * -1}px`)
    dockRef.current.style.setProperty("--dock-offset-right", `${offsetPixels}px`)
  }

  return (
    <nav ref={dockRef} className="calassist-dock" role="navigation" aria-label="Integrations Dock">
      <ul
        className={cn(
          "flex items-end rounded-2xl p-2 gap-1",
          className
        )}
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
        }}
        onMouseLeave={() => {
          if (dockRef.current) {
            dockRef.current.style.setProperty("--dock-offset-left", "0px")
            dockRef.current.style.setProperty("--dock-offset-right", "0px")
          }
        }}
      >
        {React.Children.map(children, (child) =>
          React.isValidElement<DockIconProps>(child)
            ? React.cloneElement(child as React.ReactElement<DockIconProps>, {
                handleIconHover,
                iconSize,
              })
            : child
        )}
      </ul>
    </nav>
  )
}
