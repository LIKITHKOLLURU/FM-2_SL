import { useState } from 'react'
import { X } from 'lucide-react'

export function Field({ label, error, hint, required, children, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}{required && <span className="text-red-500"> *</span>}</label>}
      {children}
      {error ? <p className="mt-1.5 text-xs text-red-600" role="alert">{error}</p> : hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

export function Input({ label, error, hint, required, className = '', icon: Icon, ...props }) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
        <input className={`input ${Icon ? 'pl-9' : ''} ${error ? 'input-error' : ''}`} {...props} />
      </div>
    </Field>
  )
}

export function Textarea({ label, error, hint, required, className = '', rows = 5, ...props }) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      <textarea rows={rows} className={`input resize-y ${error ? 'input-error' : ''}`} {...props} />
    </Field>
  )
}

export function Select({ label, error, hint, required, className = '', options, placeholder, ...props }) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      <select className={`input ${error ? 'input-error' : ''}`} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const v = typeof o === 'string' ? { value: o, label: o } : o
          return <option key={v.value} value={v.value}>{v.label}</option>
        })}
      </select>
    </Field>
  )
}

export function TagInput({ label, value, onChange, error, hint, placeholder = 'Type a skill and press Enter', required }) {
  const [text, setText] = useState('')
  const add = () => {
    const t = text.trim().replace(/,$/, '')
    if (t && !value.some((v) => v.toLowerCase() === t.toLowerCase())) onChange([...value, t])
    setText('')
  }
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      <div className={`flex flex-wrap gap-1.5 rounded-lg border bg-white p-2 shadow-sm focus-within:ring-2 ${error ? 'border-red-400 focus-within:ring-red-500/20' : 'border-slate-300 focus-within:border-brand-500 focus-within:ring-brand-500/20'}`}>
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">
            {t}
            <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((v) => v !== t))}><X className="h-3 w-3" /></button>
          </span>
        ))}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } else if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1)) }}
          onBlur={add}
          placeholder={value.length ? '' : placeholder}
          className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-slate-400"
        />
      </div>
    </Field>
  )
}
