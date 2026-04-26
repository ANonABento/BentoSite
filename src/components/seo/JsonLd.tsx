type JsonLdProps = {
  id?: string;
  data: Record<string, unknown> | unknown[];
};

function serializeJsonLd(data: JsonLdProps['data']) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function JsonLd({ id, data }: JsonLdProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
