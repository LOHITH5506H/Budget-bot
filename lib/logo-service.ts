import axios from 'axios';

interface LogoResponse {
  logo_url: string;
  company_name: string;
  domain: string;
}

class LogoService {
  private apiKey: string;
  private baseUrl = 'https://img.logo.dev';

  constructor() {
    this.apiKey = process.env.LOGO_DEV_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Logo.dev API key not provided. Logo fetching will use fallback method.');
    }
  }

  async getCompanyLogo(companyName: string): Promise<string | null> {
    try {
      console.log('Fetching logo for company:', companyName);
      
      // First, try to extract domain from company name or use common patterns
      let domain = this.guessDomainFromName(companyName);
      
      if (domain) {
        const logoUrl = await this.fetchLogoByDomain(domain);
        if (logoUrl) {
          console.log('Logo found for domain:', domain);
          return logoUrl;
        }
      }

      // Fallback: Search for company and try multiple domain variations
      const possibleDomains = this.generateDomainVariations(companyName);
      
      for (const testDomain of possibleDomains) {
        const logoUrl = await this.fetchLogoByDomain(testDomain);
        if (logoUrl) {
          console.log('Logo found for domain variation:', testDomain);
          return logoUrl;
        }
      }

      console.log('No logo found for company:', companyName);
      return null;

    } catch (error) {
      console.error('Error fetching logo:', error);
      return null;
    }
  }

  private async fetchLogoByDomain(domain: string): Promise<string | null> {
    try {
      if (this.apiKey) {
        // Use Logo.dev API if key is available
        const response = await axios.get(`${this.baseUrl}/${domain}`, {
          params: {
            token: this.apiKey,
            size: '200',
            format: 'png',
          },
          timeout: 5000,
          validateStatus: (status: number) => status === 200,
        });

        if (response.status === 200) {
          return `${this.baseUrl}/${domain}?token=${this.apiKey}&size=200&format=png`;
        }
      } else {
        // Fallback: Use free Logo.dev endpoint (limited)
        const testUrl = `${this.baseUrl}/${domain}`;
        const response = await axios.head(testUrl, { timeout: 3000 });
        
        if (response.status === 200) {
          return testUrl;
        }
      }

      return null;
    } catch (error) {
      // Domain doesn't have a logo or API error
      return null;
    }
  }

  private guessDomainFromName(companyName: string): string | null {
    const name = companyName.toLowerCase().trim();
    
    // Common service mappings
    const commonServices: Record<string, string> = {
      'netflix': 'netflix.com',
      'spotify': 'spotify.com',
      'amazon prime': 'amazon.com',
      'youtube premium': 'youtube.com',
      'google': 'google.com',
      'microsoft': 'microsoft.com',
      'apple': 'apple.com',
      'adobe': 'adobe.com',
      'dropbox': 'dropbox.com',
      'zoom': 'zoom.us',
      'slack': 'slack.com',
      'github': 'github.com',
      'linkedin': 'linkedin.com',
      'twitter': 'twitter.com',
      'facebook': 'facebook.com',
      'instagram': 'instagram.com',
      'whatsapp': 'whatsapp.com',
      'telegram': 'telegram.org',
      'discord': 'discord.com',
      'twitch': 'twitch.tv',
      'paypal': 'paypal.com',
      'stripe': 'stripe.com',
      'shopify': 'shopify.com',
      'wordpress': 'wordpress.com',
      'cloudflare': 'cloudflare.com',
      'digitalocean': 'digitalocean.com',
      'aws': 'aws.amazon.com',
      'heroku': 'heroku.com',
      'vercel': 'vercel.com',
      'notion': 'notion.so',
      'figma': 'figma.com',
      'canva': 'canva.com',
      'uber': 'uber.com',
      'lyft': 'lyft.com',
      'airbnb': 'airbnb.com',
      'booking': 'booking.com',
      'expedia': 'expedia.com',
    };

    // Check direct matches first
    for (const [service, domain] of Object.entries(commonServices)) {
      if (name.includes(service)) {
        return domain;
      }
    }

    // Try to extract domain patterns from the name
    const words = name.split(' ').filter(word => word.length > 2);
    if (words.length > 0) {
      const primaryWord = words[0];
      return `${primaryWord}.com`;
    }

    return null;
  }

  private generateDomainVariations(companyName: string): string[] {
    const cleanName = companyName.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .trim();

    if (!cleanName) return [];

    const variations = [
      `${cleanName}.com`,
      `${cleanName}.net`,
      `${cleanName}.org`,
      `${cleanName}.io`,
    ];

    // Add common word combinations
    const words = companyName.toLowerCase().split(' ').filter(word => word.length > 2);
    if (words.length > 1) {
      const combined = words.join('');
      variations.push(`${combined}.com`);
      variations.push(`${combined}.io`);
      
      // Try first word only
      variations.push(`${words[0]}.com`);
      variations.push(`${words[0]}.io`);
    }

    // Remove duplicates
    return [...new Set(variations)];
  }

  // Get placeholder/fallback logo
  generatePlaceholderLogo(companyName: string): string {
    const initials = companyName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);

    // Generate a simple placeholder using a service like UI Avatars
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=10b981&color=ffffff&format=png&rounded=true`;
  }

  // Main method to get logo with fallback
  async getLogoWithFallback(companyName: string): Promise<string> {
    const logo = await this.getCompanyLogo(companyName);
    return logo || this.generatePlaceholderLogo(companyName);
  }

  // Batch fetch logos for multiple companies
  async fetchLogosForSubscriptions(subscriptions: Array<{ id: string; name: string }>): Promise<Array<{ id: string; name: string; logo_url: string }>> {
    console.log('Fetching logos for', subscriptions.length, 'subscriptions');
    
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const logoUrl = await this.getLogoWithFallback(sub.name);
        return {
          id: sub.id,
          name: sub.name,
          logo_url: logoUrl,
        };
      })
    );

    return results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value);
  }
}

export const logoService = new LogoService();