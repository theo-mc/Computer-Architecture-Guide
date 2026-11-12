<script>
  import { Dialog as DialogPrimitive } from 'bits-ui';
  import { cn } from '$utils/cn.js';

  let { ref = $bindable(null), class: className = '', children, ...restProps } = $props();
</script>

<DialogPrimitive.Title bind:ref class={cn(className)} {...restProps}>
  {@render children?.()}
</DialogPrimitive.Title>
