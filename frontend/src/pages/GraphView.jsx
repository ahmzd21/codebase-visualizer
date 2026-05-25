import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { api } from '../api'
import Spinner from '../components/Spinner'
import ErrorCard from '../components/ErrorCard'

export default function GraphView({ repoId }) {
  const svgRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [nodeCount, setNodeCount] = useState(0)
  const [edgeCount, setEdgeCount] = useState(0)
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' })

  useEffect(() => {
    const load = async () => {
      const [res, filesRes] = await Promise.all([
        api.get(`/repos/${repoId}/graph`),
        api.get(`/repos/${repoId}/files`),
      ])
      if (!res.ok) { setError(res.error?.message || 'Failed to load graph.'); setLoading(false); return }

      const graphData = res.graph || {}
      // Build complexity lookup from files data
      const filesMap = new Map()
      if (filesRes.ok) {
        for (const f of (filesRes.files || [])) {
          filesMap.set(f.path, f)
        }
      }
      // Merge complexity into nodes
      const nodes = (graphData.nodes || []).map(n => ({
        ...n,
        complexity: filesMap.get(n.id)?.complexity || 0,
      }))
      // Map edge properties: backend uses from/to, D3 needs source/target
      const edges = (graphData.edges || []).map(e => ({
        source: e.from || e.source,
        target: e.to || e.target,
      }))
      setNodeCount(nodes.length)
      setEdgeCount(edges.length)
      setLoading(false)

      if (!nodes.length) return

      const el = svgRef.current
      const W = el.parentElement.clientWidth || 800
      const H = 520

      d3.select(el).selectAll('*').remove()

      const svg = d3.select(el)
        .attr('width', W).attr('height', H)
        .style('background', '#10131a')

      // Zoom support
      const g = svg.append('g')
      svg.call(d3.zoom().scaleExtent([0.2, 4]).on('zoom', e => g.attr('transform', e.transform)))

      // Color scale by extension
      const ext = (n) => (n.id || '').split('.').pop()
      const color = d3.scaleOrdinal()
        .domain(['js', 'jsx', 'ts', 'tsx', 'json', 'md', 'css', 'py', 'go', 'java'])
        .range(['#adc6ff','#d0bcff','#69e0a5','#ffb786','#f9b53f','#c2c6d6','#a3d9ff','#ffadad','#b5ead7','#ffd6a5'])
        .unknown('#424754')

      const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(edges).id(d => d.id).distance(90))
        .force('charge', d3.forceManyBody().strength(-250))
        .force('center', d3.forceCenter(W / 2, H / 2))
        .force('collision', d3.forceCollide(24))

      // Arrowhead marker
      svg.append('defs').append('marker')
        .attr('id', 'arrow').attr('viewBox', '0 -5 10 10')
        .attr('refX', 22).attr('refY', 0)
        .attr('markerWidth', 4).attr('markerHeight', 4)
        .attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#424754')

      const link = g.append('g').selectAll('line')
        .data(edges).join('line')
        .attr('stroke', '#424754').attr('stroke-width', 1.2)
        .attr('stroke-opacity', 0.7)
        .attr('marker-end', 'url(#arrow)')

      const node = g.append('g').selectAll('g')
        .data(nodes).join('g')
        .attr('cursor', 'pointer')
        .call(d3.drag()
          .on('start', (ev, d) => { if (!ev.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
          .on('drag',  (ev, d) => { d.fx = ev.x; d.fy = ev.y })
          .on('end',   (ev, d) => { if (!ev.active) simulation.alphaTarget(0); d.fx = null; d.fy = null })
        )

      node.append('circle')
        .attr('r', d => 8 + (d.complexity || 0) * 0.5)
        .attr('fill', d => color(ext(d)))
        .attr('stroke', '#10131a').attr('stroke-width', 2)

      node.append('text')
        .text(d => (d.id || '').split('/').pop())
        .attr('dx', 14).attr('dy', 4)
        .attr('font-size', 11).attr('fill', '#c2c6d6')
        .attr('font-family', 'Space Grotesk, sans-serif')
        .style('pointer-events', 'none')

      // Tooltip
      node.on('mouseover', (ev, d) => {
        setTooltip({ visible: true, x: ev.offsetX + 12, y: ev.offsetY - 10, text: `${d.id} · complexity: ${d.complexity ?? '—'}` })
      }).on('mousemove', (ev) => {
        setTooltip(t => ({ ...t, x: ev.offsetX + 12, y: ev.offsetY - 10 }))
      }).on('mouseout', () => {
        setTooltip(t => ({ ...t, visible: false }))
      })

      simulation.on('tick', () => {
        link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x).attr('y2', d => d.target.y)
        node.attr('transform', d => `translate(${d.x},${d.y})`)
      })
    }
    load()
  }, [repoId])

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (error) return <ErrorCard message={error} />

  return (
    <div className="flex flex-col gap-md">
      {/* Stats bar */}
      <div className="flex gap-md flex-wrap">
        {[
          { label: 'Nodes', value: nodeCount, icon: 'radio_button_checked' },
          { label: 'Edges', value: edgeCount, icon: 'share' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="card px-md py-sm flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary-container text-[18px]">{icon}</span>
            <span className="text-h2 font-h2 text-on-surface">{value}</span>
            <span className="text-body-sm font-body-sm text-on-surface-variant">{label}</span>
          </div>
        ))}
        <div className="card px-md py-sm flex items-center gap-sm ml-auto">
          <span className="material-symbols-outlined text-outline text-[16px]">pinch</span>
          <span className="text-body-sm font-body-sm text-on-surface-variant">Scroll to zoom · Drag to pan · Drag nodes</span>
        </div>
      </div>

      {/* Graph canvas */}
      <div className="card overflow-hidden relative">
        {tooltip.visible && (
          <div className="graph-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>{tooltip.text}</div>
        )}
        {nodeCount === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-body-base font-body-base text-on-surface-variant">No dependency graph data available.</p>
          </div>
        ) : (
          <svg ref={svgRef} className="w-full" />
        )}
      </div>

      {/* Legend */}
      {nodeCount > 0 && (
        <div className="card p-md">
          <p className="text-label-caps font-label-caps text-on-surface-variant mb-sm">File type legend</p>
          <div className="flex flex-wrap gap-sm">
            {[
              ['js/jsx', '#adc6ff'], ['ts/tsx', '#d0bcff'], ['json', '#f9b53f'],
              ['css', '#a3d9ff'], ['md', '#c2c6d6'], ['py', '#ffadad'],
            ].map(([lang, c]) => (
              <div key={lang} className="flex items-center gap-xs">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c }} />
                <span className="text-body-sm font-body-sm text-on-surface-variant">{lang}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
