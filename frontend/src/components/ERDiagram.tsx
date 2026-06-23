import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Table, Key, ArrowRight, Layers, Search, RefreshCw } from 'lucide-react';

interface ERDiagramProps {
  tables: Record<string, string[]>;
}

export const ERDiagram: React.FC<ERDiagramProps> = ({ tables }) => {
  const [search, setSearch] = useState('');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // Search filtering
  const tableNames = Object.keys(tables);
  const filteredTables = tableNames.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  // Analyze simple implicit relationships based on column naming conventions (e.g., user_id -> users.id)
  const getRelationships = () => {
    const relations: { fromTable: string; fromCol: string; toTable: string; toCol: string }[] = [];
    
    tableNames.forEach((tableName) => {
      const cols = tables[tableName] || [];
      cols.forEach((col) => {
        const colLower = col.toLowerCase();
        
        // Match columns like user_id, order_id, product_id, etc.
        if (colLower.endsWith('_id')) {
          const targetPrefix = colLower.substring(0, colLower.length - 3); // "user", "order", "product"
          
          // Look for matching table (pluralized or exact match)
          const matchedTargetTable = tableNames.find((t) => {
            const tLower = t.toLowerCase();
            return tLower === targetPrefix || tLower === targetPrefix + 's' || tLower === targetPrefix + 'es';
          });

          if (matchedTargetTable && matchedTargetTable !== tableName) {
            relations.push({
              fromTable: tableName,
              fromCol: col,
              toTable: matchedTargetTable,
              toCol: 'id', // assumed primary key
            });
          }
        }
      });
    });

    return relations;
  };

  const relations = getRelationships();

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm premium-border space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <span>Interactive Database ER Visualizer</span>
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Auto-detecting primary keys and relational foreign key mapping indicators.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-60">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter tables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-background pl-8.5 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/45 focus:border-primary/50 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Visual Map */}
        <div className="xl:col-span-3 bg-secondary/25 border border-border/80 rounded-xl p-6 min-h-[400px] max-h-[500px] overflow-y-auto relative custom-scrollbar flex flex-wrap gap-6 items-start justify-center">
          {filteredTables.length === 0 ? (
            <div className="m-auto text-center text-muted-foreground py-16">
              <Table className="h-10 w-10 mx-auto text-muted-foreground/35 mb-2.5" />
              <p className="text-xs font-semibold">No matching tables found.</p>
            </div>
          ) : (
            filteredTables.map((tableName) => {
              const cols = tables[tableName] || [];
              const isSelected = selectedTable === tableName;
              const hasRelation = relations.some(r => r.fromTable === tableName || r.toTable === tableName);

              return (
                <motion.div
                  key={tableName}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setSelectedTable(isSelected ? null : tableName)}
                  className={`w-60 bg-card rounded-xl border p-4.5 cursor-pointer shadow-md select-none transition-all duration-300 hover:shadow-lg ${
                    isSelected 
                      ? 'border-primary ring-2 ring-primary/20 scale-[1.02]' 
                      : 'border-border/80 hover:border-primary/40'
                  }`}
                >
                  {/* Table Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
                    <div className="flex items-center gap-1.5">
                      <Table className={`h-4 w-4 shrink-0 ${isSelected ? 'text-primary' : 'text-violet-500'}`} />
                      <span className="text-xs font-bold text-foreground font-mono truncate max-w-[140px]">
                        {tableName}
                      </span>
                    </div>
                    <span className="text-[10px] bg-secondary border border-border px-1.5 py-0.5 rounded-md font-mono text-muted-foreground">
                      {cols.length} cols
                    </span>
                  </div>

                  {/* Columns list */}
                  <div className="space-y-1.5 font-mono text-[11px]">
                    {cols.map((col, idx) => {
                      const isPK = col.toLowerCase() === 'id' || col.toLowerCase().endsWith('_pk');
                      const isFK = col.toLowerCase().endsWith('_id') && col.toLowerCase() !== 'id';

                      return (
                        <div
                          key={col}
                          className={`flex items-center justify-between px-1 py-0.5 rounded transition-colors ${
                            isPK 
                              ? 'text-amber-500 font-semibold' 
                              : isFK 
                              ? 'text-indigo-400 font-semibold' 
                              : 'text-muted-foreground'
                          }`}
                        >
                          <span className="truncate max-w-[130px]">{col}</span>
                          {isPK && (
                            <span title="Primary Key">
                              <Key className="h-3 w-3 text-amber-500 shrink-0" />
                            </span>
                          )}
                          {isFK && (
                            <span className="text-[8px] bg-indigo-500/10 px-1 rounded border border-indigo-500/20 uppercase font-sans tracking-wide">
                              FK
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Sidebar: Relationships & Specs */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-secondary/20 border border-border rounded-xl p-4.5">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3.5">
              Detected Relationships
            </h4>
            {relations.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No foreign keys recognized. Link schemas by matching table names (e.g. user_id referencing users table).
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {relations.map((rel, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-card border border-border/80 rounded-lg text-[11px] space-y-1 hover:border-primary/20 transition-all font-mono"
                  >
                    <div className="flex items-center justify-between text-foreground font-bold">
                      <span>{rel.fromTable}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{rel.toTable}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground text-[10px]">
                      <span>{rel.fromCol}</span>
                      <span>references</span>
                      <span>{rel.toCol}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4.5 text-xs text-muted-foreground space-y-2">
            <h4 className="font-bold text-foreground flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5 text-primary animate-spin" style={{ animationDuration: '6s' }} />
              <span>Catalog Sync active</span>
            </h4>
            <p className="leading-relaxed text-[11px]">
              Click on any table card to inspect columns or filter the explorer search to pinpoint database connections.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ERDiagram;
