import ns from 'web-namespaces';
// eslint-disable-next-line import/no-extraneous-dependencies
import { XMLSerializer as Serializer } from 'w3c-xmlserializer';

const XMLSerializer = Serializer.interface;

export default function serializeNodeToHtmlString(node) {
  const serialized = new XMLSerializer().serializeToString(node);

  // XMLSerializer puts xmlns on the main element that is not in the XML
  // namespace.
  // We’d like to inspect that, but having the HTML namespace everywhere will
  // get unwieldy, so remove those.
  return serialized.replace(new RegExp(` xmlns="${ns.html}"`, 'g'), '');
}
