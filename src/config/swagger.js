import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const swaggerDoc = YAML.load(path.join(__dirname, '../../docs/openapi.yaml'));

export const swaggerMiddleware = [swaggerUi.serve, swaggerUi.setup(swaggerDoc)]; 