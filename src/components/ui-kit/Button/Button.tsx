import './Button.scss'

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>

interface ButtonProps {
    className?: string
    disabled?: boolean
    icon?: IconComponent
    onClick: (e: React.FormEvent) => void
    color?: 'dark' | 'light' | 'white'
    children: React.ReactNode | string
    positionSvg?: 'left' | 'right'
}

export const Button = ({className='', disabled=false, icon: Icon, onClick, color='dark', children, positionSvg='left'}:ButtonProps) => {

  const classes = "button " + className + " button--" + color;

  return (
    <button className={classes} disabled={disabled} onClick={onClick}>
        {Icon && positionSvg === 'left' && <Icon/>}
        {children}
        {Icon && positionSvg === 'right' && <Icon/>}
    </button>
  )
}