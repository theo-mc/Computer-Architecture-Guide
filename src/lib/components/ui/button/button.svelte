<script>
  import { tv } from 'tailwind-variants';
  import { cn } from '$utils/cn.js';

  const buttonVariants = tv({
    base: '',
    variants: {
      variant: {
        default: 'btn',
        primary: 'btn primary',
        danger: 'btn danger',
        mock: 'mbtn',
        mockGo: 'mbtn go',
        qb: 'qb',
        ghost: ''
      },
      size: {
        default: '',
        sm: 'sm'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  });

  let {
    class: className = '',
    variant = 'default',
    size = 'default',
    type = 'button',
    ref = $bindable(null),
    children,
    ...restProps
  } = $props();
</script>

<button
  bind:this={ref}
  {type}
  class={cn(buttonVariants({ variant, size }), className)}
  {...restProps}
>
  {@render children?.()}
</button>
