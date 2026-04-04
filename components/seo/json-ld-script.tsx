type JsonLdScriptProps = {
  id: string;
  json: string;
  nonce?: string;
};

export function JsonLdScript({ id, json, nonce }: JsonLdScriptProps) {
  return (
    <script
      id={`jsonld-${id}`}
      suppressHydrationWarning
      nonce={nonce}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
