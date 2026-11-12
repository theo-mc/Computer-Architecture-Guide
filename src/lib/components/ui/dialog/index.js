import { Dialog as DialogPrimitive } from 'bits-ui';
import Content from './dialog-content.svelte';
import Title from './dialog-title.svelte';

const Root = DialogPrimitive.Root;
const Trigger = DialogPrimitive.Trigger;
const Close = DialogPrimitive.Close;
const Portal = DialogPrimitive.Portal;
const Overlay = DialogPrimitive.Overlay;
const Description = DialogPrimitive.Description;

export {
  Root,
  Trigger,
  Close,
  Portal,
  Overlay,
  Content,
  Title,
  Description
};
