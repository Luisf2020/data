export function getRootDomain(url: string): string {
  let hostname;
  console.log('GetRootDomain');
  console.log(url);
  // Extract the hostname from the URL
  if (url.indexOf('//') > -1) {
    hostname = url.split('/')[2];
  } else {
    hostname = url.split('/')[0];
  }

  // Remove port number and query string if present
  hostname = hostname.split(':')[0];
  hostname = hostname.split('?')[0];

  // Split the hostname into parts
  let parts = hostname.split('.');

  // If there are more than two parts, return the full hostname including the subdomain
  if (parts.length > 2) {
    return hostname;
  }

  // If there is no subdomain, simply return the hostname
  return parts.join('.');
}

export function getRootDomainFromHostname(hostname: string) {
  // Remove www. prefix if present
  const domain = hostname.replace(/^(https?:\/\/)?(www\.)?/, '');

  // Extract root domain using regex
  const rootDomainMatch = domain.match(/[^.]+\[^.]+\.[^.]+$/);

  if (rootDomainMatch) {
    return rootDomainMatch[0];
  }

  return domain;
}

export const getProtocol = (url: string) => {
  return new URL(url).protocol;
};

export default getRootDomain;
