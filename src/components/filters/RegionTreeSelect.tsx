"use client";

import { useState, useMemo } from "react";
import { ChevronRight, ChevronDown, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { buildRegionTree } from "@/lib/data/regions";
import type { RegionNode } from "@/types/region";

interface RegionTreeSelectProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

type CheckState = "checked" | "unchecked" | "indeterminate";

function getAllLeaves(node: RegionNode): string[] {
  if (node.children.length === 0) return [node.fullName];
  return node.children.flatMap(getAllLeaves);
}

function getCheckState(node: RegionNode, selected: Set<string>): CheckState {
  if (node.children.length === 0) {
    return selected.has(node.fullName) ? "checked" : "unchecked";
  }
  const leaves = getAllLeaves(node);
  const selectedCount = leaves.filter((l) => selected.has(l)).length;
  if (selectedCount === 0) return "unchecked";
  if (selectedCount === leaves.length) return "checked";
  return "indeterminate";
}

function matchesSearch(node: RegionNode, query: string): boolean {
  if (node.fullName.toLowerCase().includes(query)) return true;
  return node.children.some((c) => matchesSearch(c, query));
}

interface TreeNodeProps {
  node: RegionNode;
  selected: Set<string>;
  onToggle: (node: RegionNode) => void;
  depth: number;
  searchQuery: string;
}

function TreeNode({ node, selected, onToggle, depth, searchQuery }: TreeNodeProps) {
  const [open, setOpen] = useState(depth === 0);
  const checkState = getCheckState(node, selected);
  const hasChildren = node.children.length > 0;

  const visibleChildren = useMemo(
    () =>
      searchQuery
        ? node.children.filter((c) => matchesSearch(c, searchQuery))
        : node.children,
    [node.children, searchQuery]
  );

  if (searchQuery && !matchesSearch(node, searchQuery)) return null;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1.5 py-1 px-1 rounded hover:bg-accent cursor-pointer text-sm",
          depth === 0 && "font-medium"
        )}
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setOpen(!open)}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            aria-label={open ? "접기" : "펼치기"}
          >
            {open || searchQuery ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <Checkbox
          checked={
            checkState === "checked"
              ? true
              : checkState === "indeterminate"
              ? "indeterminate"
              : false
          }
          onCheckedChange={() => onToggle(node)}
          className="shrink-0"
          aria-label={node.name}
        />
        <span
          className="truncate text-xs leading-tight"
          onClick={() => onToggle(node)}
        >
          {node.name}
        </span>
      </div>

      {(open || searchQuery) && hasChildren && (
        <div>
          {visibleChildren.map((child) => (
            <TreeNode
              key={child.code}
              node={child}
              selected={selected}
              onToggle={onToggle}
              depth={depth + 1}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function RegionTreeSelect({ selected, onChange }: RegionTreeSelectProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const tree = useMemo(() => buildRegionTree(), []);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const handleToggle = (node: RegionNode) => {
    const leaves = getAllLeaves(node);
    const checkState = getCheckState(node, selectedSet);
    let next: Set<string>;

    if (checkState === "checked") {
      next = new Set(selected);
      leaves.forEach((l) => next.delete(l));
      // 노드 자체도 제거
      next.delete(node.fullName);
    } else {
      next = new Set(selected);
      // 중간 노드이면 노드 자체를 추가 (API 조회용)
      if (node.children.length > 0) {
        next.add(node.fullName);
        leaves.forEach((l) => next.delete(l));
      } else {
        leaves.forEach((l) => next.add(l));
      }
    }

    onChange(Array.from(next));
  };

  const filteredTree = useMemo(
    () =>
      searchQuery
        ? tree.filter((node) => matchesSearch(node, searchQuery.toLowerCase()))
        : tree,
    [tree, searchQuery]
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="지역 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-7 h-8 text-xs"
        />
      </div>
      {selected.length > 0 && (
        <div className="text-xs text-muted-foreground px-1">
          {selected.length}개 선택됨
        </div>
      )}
      <div className="overflow-y-auto max-h-64 -mx-1">
        {filteredTree.map((node) => (
          <TreeNode
            key={node.code}
            node={node}
            selected={selectedSet}
            onToggle={handleToggle}
            depth={0}
            searchQuery={searchQuery.toLowerCase()}
          />
        ))}
      </div>
    </div>
  );
}
