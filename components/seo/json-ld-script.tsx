type JsonLdScriptProps = {
  id: string;
  json: string;
};

export function JsonLdScript({ id, json }: JsonLdScriptProps) {
  return (
    <script
      id={`jsonld-${id}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
