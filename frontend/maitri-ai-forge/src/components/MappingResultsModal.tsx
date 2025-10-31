import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, Info, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MappingResult {
  [targetMessage: string]: {
    [targetKey: string]: {
      key1?: KeyInfo;
      key2?: KeyInfo;
      key3?: KeyInfo;
    };
  };
}

interface KeyInfo {
  final_score: number;
  source_message: string;
  source_key: string;
  source_file: string;
  source_country: string;
  source_domain: string;
  source_system: string;
}

interface MappingResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: MappingResult;
  onApprove?: (approvedMappings: Array<{ targetKey: string; sourceKey: string }>) => void;
}

export const MappingResultsModal = ({ isOpen, onClose, results, onApprove }: MappingResultsModalProps) => {
  const [selectedKeys, setSelectedKeys] = useState<Record<string, string>>({});
  const [isApproved, setIsApproved] = useState(false);
  const [hasEdited, setHasEdited] = useState(false);

  // Initialize selected keys with key1 as default
  const initializeSelections = () => {
    const selections: Record<string, string> = {};
    Object.entries(results).forEach(([targetMessage, mappings]) => {
      Object.entries(mappings).forEach(([targetKey]) => {
        const key = `${targetMessage}::${targetKey}`;
        selections[key] = 'key1';
      });
    });
    return selections;
  };

  if (isOpen && Object.keys(selectedKeys).length === 0) {
    setSelectedKeys(initializeSelections());
  }

  const handleKeySelect = (targetMessage: string, targetKey: string, keyNum: string) => {
    const key = `${targetMessage}::${targetKey}`;
    setSelectedKeys({
      ...selectedKeys,
      [key]: keyNum
    });
    setHasEdited(true);
  };

  const handleApprove = () => {
    const approvedMappings: Array<{ targetKey: string; sourceKey: string }> = [];
    
    Object.entries(results).forEach(([targetMessage, mappings]) => {
      Object.entries(mappings).forEach(([targetKey, keys]) => {
        const key = `${targetMessage}::${targetKey}`;
        const selectedKeyNum = selectedKeys[key] || 'key1';
        const selectedKeyInfo = keys[selectedKeyNum as keyof typeof keys];
        
        if (selectedKeyInfo) {
          approvedMappings.push({
            targetKey: `${targetMessage}::${targetKey}`,
            sourceKey: `${selectedKeyInfo.source_message}::${selectedKeyInfo.source_key}`
          });
        }
      });
    });

    setIsApproved(true);
    onApprove?.(approvedMappings);
  };

  const handleDownloadCSV = () => {
    const csvRows: string[] = ['Target Key,Source Key'];
    
    Object.entries(results).forEach(([targetMessage, mappings]) => {
      Object.entries(mappings).forEach(([targetKey, keys]) => {
        const key = `${targetMessage}::${targetKey}`;
        const selectedKeyNum = selectedKeys[key] || 'key1';
        const selectedKeyInfo = keys[selectedKeyNum as keyof typeof keys];
        
        if (selectedKeyInfo) {
          csvRows.push([
            `${targetMessage}::${targetKey}`,
            `${selectedKeyInfo.source_message}::${selectedKeyInfo.source_key}`
          ].join(','));
        }
      });
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'approved_mapping.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderKeyCell = (
    targetMessage: string,
    targetKey: string,
    keyNum: string,
    keyInfo?: KeyInfo
  ) => {
    const key = `${targetMessage}::${targetKey}`;
    const isSelected = selectedKeys[key] === keyNum;

    if (!keyInfo) {
      return (
        <td className="px-4 py-3 border-r border-border/50 bg-muted/20">
          <div className="text-center text-muted-foreground text-xs">-</div>
        </td>
      );
    }

    return (
      <td 
        className={cn(
          "px-4 py-3 border-r border-border/50 cursor-pointer transition-all",
          isSelected ? "bg-gradient-to-r from-primary/30 to-accent/30 ring-2 ring-primary shadow-md" : "hover:bg-muted/30 hover:shadow-sm"
        )}
        onClick={() => handleKeySelect(targetMessage, targetKey, keyNum)}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-3 h-3 rounded-full transition-all flex-shrink-0",
                  isSelected ? "bg-primary ring-2 ring-primary/30 shadow-lg" : "bg-muted-foreground/30"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{keyInfo.source_key}</div>
                  <div className="text-xs text-muted-foreground truncate">{keyInfo.source_message}</div>
                </div>
                <Info className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs bg-card border-2 border-primary/20">
              <div className="space-y-2 text-xs">
                <div className="font-bold text-primary border-b border-primary/20 pb-1">Mapping Details</div>
                <p><strong>Score:</strong> <span className="text-accent">{keyInfo.final_score.toFixed(3)}</span></p>
                <p><strong>Source Key:</strong> {keyInfo.source_key}</p>
                <p><strong>Message:</strong> {keyInfo.source_message}</p>
                <p><strong>File:</strong> {keyInfo.source_file}</p>
                <p><strong>Country:</strong> {keyInfo.source_country}</p>
                <p><strong>Domain:</strong> {keyInfo.source_domain}</p>
                <p><strong>System:</strong> {keyInfo.source_system}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </td>
    );
  };

  if (isApproved) {
    const approvedData: Array<{ targetKey: string; sourceKey: string }> = [];
    Object.entries(results).forEach(([targetMessage, mappings]) => {
      Object.entries(mappings).forEach(([targetKey, keys]) => {
        const key = `${targetMessage}::${targetKey}`;
        const selectedKeyNum = selectedKeys[key] || 'key1';
        const selectedKeyInfo = keys[selectedKeyNum as keyof typeof keys];
        if (selectedKeyInfo) {
          approvedData.push({
            targetKey: `${targetMessage}::${targetKey}`,
            sourceKey: `${selectedKeyInfo.source_message}::${selectedKeyInfo.source_key}`
          });
        }
      });
    });

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Approved Mapping
          </DialogTitle>

          <ScrollArea className="flex-1 mt-4 pr-4 overflow-scroll">
            <table className="w-full border-collapse border-2 border-border rounded-lg overflow-hidden shadow-lg">
              <thead>
                <tr className="bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20">
                  <th className="px-6 py-4 text-left font-bold border-r-2 border-border w-1/2 text-primary">
                    Target Key
                  </th>
                  <th className="px-6 py-4 text-left font-bold w-1/2 text-accent">
                    Source Key
                  </th>
                </tr>
              </thead>
              <tbody>
                {approvedData.map((mapping, index) => (
                  <tr key={index} className={cn(
                    "border-t-2 border-border transition-all hover:bg-muted/50",
                    index % 2 === 0 ? "bg-card" : "bg-muted/20"
                  )}>
                    <td className="px-6 py-4 font-semibold border-r-2 border-border">
                      {mapping.targetKey}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {mapping.sourceKey}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>

          <div className="flex justify-center pt-4 border-t">
            <Button
              size="lg"
              onClick={handleDownloadCSV}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Download as CSV
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] flex flex-col">
        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Mapping Results
        </DialogTitle>

        <ScrollArea className="flex-1 mt-4 pr-4 overflow-scroll">
          <div className="space-y-8">
            {Object.entries(results).map(([targetMessage, mappings]) => (
              <div key={targetMessage} className="space-y-4">
                <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 pb-2 border-b-2 border-primary">
                  <h3 className="text-xl font-semibold text-primary">{targetMessage}</h3>
                </div>

                <div className="overflow-x-auto rounded-lg border-2 border-border shadow-lg">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-primary/20 to-accent/20">
                        <th className="px-6 py-4 text-left font-bold border-r-2 border-border bg-gradient-to-r from-primary/10 to-primary/5">
                          Destination Key
                        </th>
                        <th className="px-6 py-4 text-center font-bold border-r-2 border-border bg-gradient-to-r from-accent/10 to-accent/5" colSpan={3}>
                          Origin Keys (hover for details)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(mappings).map(([targetKey, keys], index) => (
                        <tr key={targetKey} className={cn(
                          "border-t-2 border-border transition-all",
                          index % 2 === 0 ? "bg-card hover:bg-muted/30" : "bg-muted/20 hover:bg-muted/40"
                        )}>
                          <td className="px-6 py-4 font-semibold border-r-2 border-border bg-muted/30">
                            {targetKey}
                          </td>
                          {renderKeyCell(targetMessage, targetKey, 'key1', keys.key1)}
                          {renderKeyCell(targetMessage, targetKey, 'key2', keys.key2)}
                          {renderKeyCell(targetMessage, targetKey, 'key3', keys.key3)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-center pt-4 border-t">
          <Button
            size="lg"
            onClick={handleApprove}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg"
          >
            {hasEdited ? (
              <>
                <Edit className="w-5 h-5 mr-2" />
                Approve Edited
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Approve
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
