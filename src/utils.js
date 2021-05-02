import ns from 'web-namespaces'
import serialize from 'w3c-xmlserializer'

export default function serializeNodeToHtmlString(node) {
  const serialized = serialize(node)

  // XMLSerializer puts xmlns on “main” elements that are not in the XML
  // namespace.
  // We’d like to inspect that, but having the HTML namespace everywhere will
  // get unwieldy, so remove those.
  return serialized
    .replace(new RegExp(` xmlns="${ns.html}"`, 'g'), '')
    .replace(new RegExp(`(<(?:svg|g)) xmlns="${ns.svg}"`, 'g'), '$1')
}
