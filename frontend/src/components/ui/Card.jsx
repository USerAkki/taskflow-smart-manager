import React from 'react'

export default function Card({ children, className = '', onClick, ...props }) {
  const isClickable = typeof onClick === 'function'

  return (
    <div
      className={`bg-[#161b27] border border-[#2d3748] rounded-2xl p-5 shadow-lg transition-all duration-200 ${
        isClickable
          ? 'cursor-pointer hover:border-brand-500/50 hover:shadow-brand-500/10 hover:-translate-y-0.5 active:translate-y-0'
          : ''
      } ${className}`}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick(e) : undefined}
      {...props}
    >
      {children}
    </div>
  )
}
