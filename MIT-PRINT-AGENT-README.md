# STARK QR MIT Cloud Print Agent

MIT-only local print agent for the Citizen CL-E321 configured as DMI / STD.

## Files
- mit-print-agent.mjs: Node.js polling agent (built-in modules only).
- mit-dpl.js: browser-side one-label DPL payload builder.
- .env.example: configuration template. Copy to .env and add the existing queue token.

## Office PC setup
1. Download these files from the GitHub repository into one folder on the office PC.
2. Copy .env.example to a new file named .env.
3. Open .env in Notepad. Keep the Apps Script URL as shown and paste the existing MIT queue API token after STARK_PRINT_QUEUE_TOKEN=. Never upload or share .env.
4. Open Command Prompt in that folder and run: node --env-file=.env mit-print-agent.mjs
5. Keep that Command Prompt window open while printing.

Node.js is already installed. No npm packages, administrator install, Windows service, inbound firewall port, or printer internet exposure is required. The agent makes outbound HTTPS requests and sends raw DPL over the office LAN to printer TCP port 9100.

## Important queue behaviour
- The MIT web page queues one DPL label per click, using the first sticker fields as the current MIT page does today.
- The agent only sends jobs whose queue format is DPL and whose payload matches the expected one-label envelope.
- The agent reports PRINTED after the TCP send completes. This confirms the data was handed to the printer connection; it is not a sensor-confirmed physical print acknowledgement.
- The Apps Script queue has no lease/reclaim operation. If the PC/agent stops after POLL claims a job, it can remain in PRINTING. Inspect status before manually retrying to avoid duplicates.
- Existing old TSPL queue rows are not printed by this agent; they are marked FAILED as unsupported rather than sent in the wrong language.
- This agent does not change W2R, R2W, SRN, Serial, Non-Serial, dashboard, or printer settings.
