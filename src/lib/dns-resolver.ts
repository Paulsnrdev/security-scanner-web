import dns from "node:dns/promises";

// dns.resolve*() goes through c-ares using whatever nameservers the host
// machine is configured with. On networks where that's misconfigured (a VPN
// or local DNS proxy pointing at an unreachable address, for example — seen
// in dev on a machine whose c-ares servers were stuck at 127.0.0.1) every
// resolve*() call fails even though the domain resolves fine. Use a
// dedicated resolver pinned to well-known public resolvers so DNS-dependent
// code doesn't depend on the host's local DNS configuration.
export const publicResolver = new dns.Resolver();
publicResolver.setServers(["1.1.1.1", "8.8.8.8"]);
