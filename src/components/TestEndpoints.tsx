import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export const TestEndpoints = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{
    processVideo?: { status: string; message: string };
    compareMedia?: { status: string; message: string };
  }>({});
  const { toast } = useToast();

  const testProcessVideoEndpoint = async () => {
    try {
      // Create a minimal test file
      const testFile = new File(['test'], 'test.mp4', { type: 'video/mp4' });
      const formData = new FormData();
      formData.append('video', testFile);
      formData.append('settings', JSON.stringify({ quality: 'medium' }));
      formData.append('numCopies', '1');

      const response = await fetch('https://repurpose-flow-toolkit-prueba-48-production.up.railway.app/process-video', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      const contentType = response.headers.get('content-type');
      let result;
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        result = { error: `Non-JSON response: ${text.substring(0, 100)}` };
      }

      setResults(prev => ({
        ...prev,
        processVideo: {
          status: response.ok ? 'success' : 'error',
          message: response.ok ? 'Endpoint is responding' : result.error || 'Error response'
        }
      }));

    } catch (error) {
      setResults(prev => ({
        ...prev,
        processVideo: {
          status: 'error',
          message: error.message || 'Connection failed'
        }
      }));
    }
  };

  const testCompareMediaEndpoint = async () => {
    try {
      // Create minimal test files
      const testFile1 = new File(['test1'], 'test1.mp4', { type: 'video/mp4' });
      const testFile2 = new File(['test2'], 'test2.mp4', { type: 'video/mp4' });
      const formData = new FormData();
      formData.append('file1', testFile1);
      formData.append('file2', testFile2);
      formData.append('operation', 'compare-media');

      const response = await fetch('https://repurpose-flow-toolkit-prueba-48-production.up.railway.app/compare-media', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      const contentType = response.headers.get('content-type');
      let result;
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        result = { error: `Non-JSON response: ${text.substring(0, 100)}` };
      }

      setResults(prev => ({
        ...prev,
        compareMedia: {
          status: response.ok ? 'success' : 'error',
          message: response.ok ? 'Endpoint is responding' : result.error || 'Error response'
        }
      }));

    } catch (error) {
      setResults(prev => ({
        ...prev,
        compareMedia: {
          status: 'error',
          message: error.message || 'Connection failed'
        }
      }));
    }
  };

  const testAllEndpoints = async () => {
    setTesting(true);
    setResults({});
    
    try {
      await Promise.all([
        testProcessVideoEndpoint(),
        testCompareMediaEndpoint()
      ]);
      
      toast({
        title: "Pruebas completadas",
        description: "Revisa los resultados abajo",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error en las pruebas",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'success') return <Badge className="bg-green-500">✓ Funcionando</Badge>;
    if (status === 'error') return <Badge variant="destructive">✗ Error</Badge>;
    return <Badge variant="secondary">⏳ Pendiente</Badge>;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Prueba de Endpoints Railway</CardTitle>
        <p className="text-sm text-muted-foreground">
          Servidor: repurpose-flow-toolkit-prueba-48-production.up.railway.app
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testAllEndpoints} 
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Probando...' : 'Probar Todos los Endpoints'}
        </Button>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded">
            <div>
              <div className="font-medium">/process-video</div>
              <div className="text-sm text-muted-foreground">Procesamiento de videos</div>
            </div>
            <div className="text-right">
              {results.processVideo ? getStatusBadge(results.processVideo.status) : getStatusBadge('pending')}
              {results.processVideo && (
                <div className="text-xs mt-1 max-w-xs break-words">
                  {results.processVideo.message}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded">
            <div>
              <div className="font-medium">/compare-media</div>
              <div className="text-sm text-muted-foreground">Comparación de archivos</div>
            </div>
            <div className="text-right">
              {results.compareMedia ? getStatusBadge(results.compareMedia.status) : getStatusBadge('pending')}
              {results.compareMedia && (
                <div className="text-xs mt-1 max-w-xs break-words">
                  {results.compareMedia.message}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
          <strong>Información:</strong> Esta prueba envía archivos mínimos para verificar la conectividad. 
          Los endpoints deben responder con JSON válido. FFmpeg se probará automáticamente cuando proceses archivos reales.
        </div>
      </CardContent>
    </Card>
  );
};