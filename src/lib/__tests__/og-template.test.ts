import { describe, expect, it } from 'vitest';
import { OG_SITE_DOMAIN, resolveOgCard } from '../og-card';
import { buildCardTemplate } from '../og-template';

type Node = { type: string; props: { style?: Record<string, unknown>; children?: Node[] | string } };

/** Every node in the template, depth first. */
function walk(node: Node): Node[] {
  const children = Array.isArray(node.props.children) ? node.props.children : [];
  return [node, ...children.flatMap(walk)];
}

const NOW = new Date('2026-11-24T16:00:00Z');
const PAGES = ['/', '/days-since-ohio-state-beat-michigan', '/countdown', '/preview', '/record', '/record/2024'];

describe('buildCardTemplate', () => {
  it.each(PAGES)('prints the site address in ink at a size a feed keeps readable on %s', (path) => {
    const template = buildCardTemplate(resolveOgCard(path, NOW)!, 'data:image/png;base64,') as Node;
    const address = walk(template).filter((node) => node.props.children === OG_SITE_DOMAIN);

    expect(address).toHaveLength(1);
    // A feed draws the 1200px card near 500px wide, so 30px lands near 12px.
    expect(address[0].props.style?.fontSize).toBeGreaterThanOrEqual(30);
    expect(address[0].props.style?.color).toBe('#111');
  });
});
