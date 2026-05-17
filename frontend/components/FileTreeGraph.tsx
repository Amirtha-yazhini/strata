'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export interface FileStat {
  created_at: string;
  authors: Record<string, number>;
  bus_factor_risk: boolean;
}

interface FileTreeGraphProps {
  fileStats: Record<string, FileStat>;
  maxDate: string;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: 'dir' | 'file';
  risk: boolean;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

export default function FileTreeGraph({ fileStats, maxDate }: FileTreeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !fileStats) return;

    // 1. Filter files by maxDate
    const maxTime = new Date(maxDate).getTime();
    const activeFiles = Object.entries(fileStats).filter(([path, stat]) => {
      return new Date(stat.created_at).getTime() <= maxTime;
    });

    // 2. Build tree structure (nodes and links)
    const nodesMap = new Map<string, GraphNode>();
    const links: GraphLink[] = [];

    // Root node
    nodesMap.set('root', { id: 'root', name: 'root', type: 'dir', risk: false });

    activeFiles.forEach(([filePath, stat]) => {
      const parts = filePath.split('/');
      let currentPath = '';

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;
        const parentPath = currentPath || 'root';
        
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!nodesMap.has(currentPath)) {
          nodesMap.set(currentPath, {
            id: currentPath,
            name: part,
            type: isFile ? 'file' : 'dir',
            risk: isFile ? stat.bus_factor_risk : false
          });

          links.push({
            source: parentPath,
            target: currentPath
          });
        } else if (isFile) {
            // Update risk if it was created as a dir but is actually a file (edge case)
            const node = nodesMap.get(currentPath)!;
            node.risk = stat.bus_factor_risk;
            node.type = 'file';
        }
      }
    });

    const nodes = Array.from(nodesMap.values());

    // 3. D3 Setup
    const width = 800;
    const height = 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    svg.attr('viewBox', [0, 0, width, height]);

    // Zoom support
    const g = svg.append('g');
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);

    // Force simulation
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(30))
      .force('charge', d3.forceManyBody().strength(-150))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(15));

    // Links
    const link = g.append('g')
      .attr('stroke', '#334155') // slate-700
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 1.5);

    // Tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'absolute hidden bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 pointer-events-none z-50');

    // Nodes
    const node = g.append('g')
      .attr('stroke', '#0f172a') // slate-900
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', d => d.type === 'dir' ? 8 : 5)
      .attr('fill', d => {
        if (d.type === 'dir') return '#3b82f6'; // blue-500
        return d.risk ? '#ef4444' : '#10b981'; // red-500 vs emerald-500
      })
      .call((d3.drag<SVGCircleElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })) as any)
        .on('mouseover', (event, d) => {
           tooltip.style('display', 'block')
                  .html(`<strong>${d.name}</strong><br/>Type: ${d.type}<br/>Risk: ${d.risk ? 'High (Bus Factor)' : 'Low'}`);
        })
        .on('mousemove', (event) => {
           tooltip.style('left', (event.pageX + 10) + 'px')
                  .style('top', (event.pageY + 10) + 'px');
        })
        .on('mouseout', () => {
           tooltip.style('display', 'none');
        });

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => (d.target as GraphNode).x!)
        .attr('y2', d => (d.target as GraphNode).y!);

      node
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);
    });

    return () => {
      simulation.stop();
      tooltip.remove();
    };
  }, [fileStats, maxDate]);

  return (
    <div className="w-full h-[600px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden cursor-move relative shadow-xl">
        <svg ref={svgRef} className="w-full h-full" />
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-slate-900/90 p-3 rounded-lg border border-slate-700 text-xs space-y-2 backdrop-blur-sm pointer-events-none">
            <div className="flex items-center gap-2 text-slate-300"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> Directory</div>
            <div className="flex items-center gap-2 text-slate-300"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Safe File</div>
            <div className="flex items-center gap-2 text-slate-300"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> High Risk (Bus Factor)</div>
        </div>
    </div>
  );
}
