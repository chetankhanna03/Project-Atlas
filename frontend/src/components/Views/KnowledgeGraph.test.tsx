import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, it } from 'vitest';
import { KnowledgeGraph, snapshotGraph } from './KnowledgeGraph';

it('builds taxon nodes from historical OBIS records without assigning recent query dates',()=>{
  const graph=snapshotGraph({query:{west:50,south:5,east:78,north:25,start:'2026-09-01',end:'2026-09-20',parameter:'temperature',species:'',layers:['obis'],obisPeriod:'all_time'},loaded:'2026-09-20',results:[{layer:'obis',data:{results:[{scientific_name:'Fixture taxon',event_date:'1976-01-01'}]}}]});
  expect(graph.nodes.some(n=>n.kind==='species'&&n.label==='Fixture taxon')).toBe(true);
  expect(graph.nodes.some(n=>n.kind==='time'&&n.label==='1976-01-01')).toBe(true);
  expect(graph.nodes.some(n=>n.kind==='time'&&n.label==='2026-09-01')).toBe(false);
});

it('shows actual provenance and bounds the graph with explicit expansion',()=>{
  const graph={nodes:Array.from({length:60},(_,i)=>({id:String(i),kind:i===0?'species':'evidence',label:i===0?'Fixture taxon':`Fixture ${i}`,data:{page:i+1,source:'Test fixture'}})),edges:[],persistence:'request_only',limitations:[]};
  render(<KnowledgeGraph graph={graph}/>);
  expect(screen.getByText(/20 of 60/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'species: Fixture taxon'}));
  expect(screen.getByRole('button',{name:'Resolve with WoRMS'})).toBeTruthy();
  expect(screen.getByText(/"source": "Test fixture"/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Expand 40 nodes'}));
  expect(screen.getByText(/60 of 60/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Zoom in'}));
  fireEvent.click(screen.getByRole('button',{name:'Fit to view'}));
});

