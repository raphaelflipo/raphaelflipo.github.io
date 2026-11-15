import { PRO_HTML } from '../src/pro.mjs';
import { configured } from '../src/worker.mjs';
if(!PRO_HTML){console.error('BLOCKED: existing RC1 Pro HTML has not been integrated. No sale may be activated.');process.exitCode=1;}
if(!configured(process.env,PRO_HTML)){console.error('BLOCKED: seller details, terms/privacy, public HTTPS origin, session secret or Stripe configuration are missing, or SALES_ENABLED is false.');process.exitCode=1;}
if(!process.exitCode)console.log('Configuration present. Still requires a real Stripe TEST purchase, recovery, cancellation and RC1 browser check before live activation.');
