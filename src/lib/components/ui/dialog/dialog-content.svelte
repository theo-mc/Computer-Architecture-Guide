<script>
  import { Dialog as DialogPrimitive } from 'bits-ui';
  import { cn } from '$utils/cn.js';

  let {
    ref = $bindable(null),
    class: className = '',
    overlayClass = '',
    children,
    ...restProps
  } = $props();
</script>

<DialogPrimitive.Portal>
  <DialogPrimitive.Overlay class={cn('fixed inset-0 z-[75]', overlayClass)} />
  <DialogPrimitive.Content
    bind:ref
    class={cn('fixed z-[80] outline-none', className)}
    {...restProps}
  >
    {@render children?.()}
  </DialogPrimitive.Content>
</DialogPrimitive.Portal>
