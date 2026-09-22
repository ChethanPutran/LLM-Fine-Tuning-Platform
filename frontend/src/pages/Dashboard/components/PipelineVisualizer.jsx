import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
  addEdge,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Paper, Box, Typography, IconButton, Tooltip } from '@mui/material';
import { ZoomIn, ZoomOut, FitScreen } from '@mui/icons-material';

import {getPipelineEdges, getStageLevels} from '../../../utils/pipelineEdges';

/* ------------------------------------------------------------------ */
/* Constants — hoisted so React Flow doesn't warn about recreations   */
/* ------------------------------------------------------------------ */

const NODE_TYPES = {};
const EDGE_TYPES = {};

const NODE_WIDTH = 180;
const COLUMN_GAP = 260;
const ROW_GAP = 110;
const TOP_MARGIN = 80;

const baseNodeStyle = {
  padding: '10px 20px',
  borderRadius: '10px',
  fontSize: '14px',
  color: '#fff',
  width: NODE_WIDTH,
  textAlign: 'center',
  fontWeight: 'bold',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  border: 'none',
};

const baseEdgeStyle = {
  animated: true,
  style: { stroke: '#94a3b8', strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
  labelStyle: { fill: '#475569', fontSize: 11, fontWeight: 600 },
  labelBgStyle: { fill: '#f8fafc', fillOpacity: 0.9 },
  labelBgPadding: [4, 2],
  labelBgBorderRadius: 4,
};

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

const PipelineVisualizer = ({
  pipelineNodes,
  onNodeClick,
  onConnect,
  brokenStageIds = new Set(),
  cycleStageIds = new Set(),
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef(null);

  /* ---- Derived edges from artifact refs ---- */
  const derivedEdges = useMemo(
    () => getPipelineEdges(pipelineNodes),
    [pipelineNodes]
  );

  /* ---- Dependency levels for column layout ---- */
  const levels = useMemo(
    () => getStageLevels(pipelineNodes),
    [pipelineNodes]
  );

  /* ---- Position nodes by (level, index-within-level) ---- */
  const positionedNodes = useMemo(() => {
    const rowByLevel = {};
    return pipelineNodes.map((node) => {
      const level = levels[node.id] ?? 0;
      const row = rowByLevel[level] ?? 0;
      rowByLevel[level] = row + 1;

      const isBroken = brokenStageIds.has(node.id);
      const inCycle = cycleStageIds.has(node.id);

      // Outline precedence: cycle (red) > broken (orange)
      let outline = 'none';
      let outlineColor = null;
      if (inCycle) {
        outline = '3px solid #ef4444';
        outlineColor = '#ef4444';
      } else if (isBroken) {
        outline = '3px solid #f59e0b';
        outlineColor = '#f59e0b';
      }

      return {
        id: node.id,
        data: {
          label: node.name,
          description: node.description,
          config: node.config,
          broken: isBroken,
          inCycle,
        },
        position: {
          x: level * COLUMN_GAP,
          y: TOP_MARGIN + row * ROW_GAP,
        },
        style: {
          ...baseNodeStyle,
          background: node.color || '#1976d2',
          outline,
          outlineOffset: 2,
          outlineColor,
        },
      };
    });
  }, [pipelineNodes, levels, brokenStageIds, cycleStageIds]);

  /* ---- Sync into React Flow's internal state ---- */
  useEffect(() => {
    setNodes(positionedNodes);
    setEdges(derivedEdges.map((e) => ({ ...e, ...baseEdgeStyle })));
  }, [positionedNodes, derivedEdges, setNodes, setEdges]);

  /* ---- Handlers ---- */
  const onConnectHandler = useCallback(
    (params) => {
      setEdges((eds) => addEdge({ ...params, ...baseEdgeStyle }, eds));
      if (onConnect) onConnect(params);
    },
    [setEdges, onConnect]
  );

  const handleNodeClick = useCallback(
    (_event, node) => {
      if (onNodeClick) onNodeClick(node);
    },
    [onNodeClick]
  );

  const fitView = useCallback(() => reactFlowWrapper.current?.fitView(), []);
  const zoomIn = useCallback(() => reactFlowWrapper.current?.zoomIn(), []);
  const zoomOut = useCallback(() => reactFlowWrapper.current?.zoomOut(), []);

  /* ---- Empty state ---- */
  if (!pipelineNodes || pipelineNodes.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          height: '400px',
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f8fafc',
        }}
      >
        <Box textAlign="center">
          <Typography variant="body1" color="text.secondary">
            No pipeline stages added yet
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Add stages from the left panel to build your pipeline
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        height: '450px',
        borderRadius: 3,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        position: 'relative',
        bgcolor: '#f8fafc',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 10,
          display: 'flex',
          gap: 1,
        }}
      >
        <Tooltip title="Zoom In">
          <IconButton size="small" onClick={zoomIn} sx={{ bgcolor: 'white', boxShadow: 1 }}>
            <ZoomIn />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom Out">
          <IconButton size="small" onClick={zoomOut} sx={{ bgcolor: 'white', boxShadow: 1 }}>
            <ZoomOut />
          </IconButton>
        </Tooltip>
        <Tooltip title="Fit View">
          <IconButton size="small" onClick={fitView} sx={{ bgcolor: 'white', boxShadow: 1 }}>
            <FitScreen />
          </IconButton>
        </Tooltip>
      </Box>

      <ReactFlow
        ref={reactFlowWrapper}
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnectHandler}
        onNodeClick={handleNodeClick}
        fitView
        attributionPosition="bottom-right"
        minZoom={0.3}
        maxZoom={2}
      >
        <Background variant="dots" gap={20} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => node.style?.background || '#1976d2'}
          maskColor="rgba(0,0,0,0.1)"
        />
      </ReactFlow>
    </Paper>
  );
};

export default PipelineVisualizer;