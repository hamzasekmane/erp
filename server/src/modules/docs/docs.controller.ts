import { Controller, Get, Header } from "@nestjs/common";
import { buildOpenApiDocument } from "../../openapi/document";
import { apiDocsEnabled } from "../../config/env";
import { Public } from "../../shared/security/decorators";
import { AppError } from "../../shared/errors";

const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/><title>ERP API — Documentation</title>
<style>body{margin:0;font-family:system-ui,sans-serif}</style></head>
<body><redoc spec-url="/api/openapi.json"></redoc>
<script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script></body></html>`;

@Controller()
export class DocsController {
  @Public()
  @Get("openapi.json")
  document() {
    if (!apiDocsEnabled) throw AppError.notFound("Documentation désactivée");
    return buildOpenApiDocument();
  }

  @Public()
  @Get("docs")
  @Header("Content-Type", "text/html; charset=utf-8")
  docs() {
    if (!apiDocsEnabled) throw AppError.notFound("Documentation désactivée");
    return html;
  }
}
