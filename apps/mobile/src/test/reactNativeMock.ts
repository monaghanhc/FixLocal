import type { PropsWithChildren } from 'react';
import { createElement } from 'react';

export const View = (props: PropsWithChildren<{ style?: unknown }>) =>
  createElement('View', props, props.children);

export const Text = (props: PropsWithChildren<{ style?: unknown }>) =>
  createElement('Text', props, props.children);

export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
};
