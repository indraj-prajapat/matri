import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Edit2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApprovedMapping {
  targetKey: string;
  sourceKey: string;
}

interface ApprovedMappingViewProps {
  isOpen: boolean;
  onClose: () => void;
  mappings: ApprovedMapping[];
  onSave?: (mappings: ApprovedMapping[]) => void;
}

export const ApprovedMappingView = ({ isOpen, onClose, mappings: initialMappings, onSave }: ApprovedMappingViewProps) => {
  const [mappings, setMappings] = useState<ApprovedMapping[]>(initialMappings);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState({ targetKey: '', sourceKey: '' });

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(mappings[index]);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null) {
      const newMappings = [...mappings];
      newMappings[editingIndex] = editValue;
      setMappings(newMappings);
      setEditingIndex(null);
      onSave?.(newMappings);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue({ targetKey: '', sourceKey: '' });
  };

  const handleDownloadCSV = () => {
    const csvRows = ['Destination Key,Origin Key'];
    mappings.forEach(({ targetKey, sourceKey }) => {
      csvRows.push(`${targetKey},${sourceKey}`);
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
                  Destination Key
                </th>
                <th className="px-6 py-4 text-left font-bold border-r-2 border-border w-1/2 text-accent">
                  Origin Key
                </th>
                <th className="px-6 py-4 text-center font-bold w-28">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((mapping, index) => (
                <tr key={index} className={cn(
                  "border-t-2 border-border transition-all hover:bg-muted/50",
                  index % 2 === 0 ? "bg-card" : "bg-muted/20"
                )}>
                  {editingIndex === index ? (
                    <>
                      <td className="px-6 py-4 border-r-2 border-border">
                        <Input
                          value={editValue.targetKey}
                          onChange={(e) => setEditValue({ ...editValue, targetKey: e.target.value })}
                          className="w-full font-medium border-2 focus:border-primary"
                        />
                      </td>
                      <td className="px-6 py-4 border-r-2 border-border">
                        <Input
                          value={editValue.sourceKey}
                          onChange={(e) => setEditValue({ ...editValue, sourceKey: e.target.value })}
                          className="w-full font-medium border-2 focus:border-accent"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleSaveEdit}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium border-r border-border">
                        {mapping.targetKey}
                      </td>
                      <td className="px-4 py-3 font-medium border-r border-border">
                        {mapping.sourceKey}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(index)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </>
                  )}
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
            <Download className="w-5 h-5 mr-2" />
            Download as CSV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
