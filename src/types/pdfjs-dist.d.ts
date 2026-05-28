declare module "pdfjs-dist/build/pdf.mjs" {
    export const GlobalWorkerOptions: { workerSrc: string };
    export function getDocument(options: { data: ArrayBuffer }): {
        promise: Promise<unknown>;
    };
}
