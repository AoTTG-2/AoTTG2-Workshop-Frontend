import type { LegalSlug } from "../../lib/legal";

export interface LegalSection {
  title: string;
  body?: string[];
  bullets?: string[];
}

export interface LegalBody {
  intro: string[];
  sections: LegalSection[];
}

export const LEGAL_BODIES: Record<LegalSlug, LegalBody> = {
  disclaimer: {
    intro: [
      "AoTTG2 Workshop is an unofficial, volunteer-run, community-driven fan project. It is not affiliated with, endorsed by, sponsored by, or licensed by the owners of Attack on Titan or any other referenced franchise unless an express written statement says otherwise.",
      "Workshop listings, URLs, hosted files, comments, creator profiles, tags, and descriptions are submitted by individual users. Each submitter is responsible for having the rights and permissions needed for anything they post or upload.",
    ],
    sections: [
      {
        title: "Third-party rights",
        body: [
          "Third-party names, trademarks, logos, characters, artwork, designs, textures, models, audio, and other protected material remain the property of their respective owners. References on the Workshop are for identification and community discussion only and do not imply ownership, permission, approval, or endorsement.",
        ],
      },
      {
        title: "What AoTTG2 hosts",
        body: [
          "For URL-backed skins and images, the Workshop stores listing information and the submitted URL. The original skin or image file remains with the external host shown or implied by the URL. Previews may load directly from that host or through a disclosed technical image provider.",
          "For maps, custom logic, addons, experiences, and similar package files, AoTTG2 may host the user-submitted file. The uploader remains responsible for every item inside that file, including code, textures, models, names, sounds, brands, and bundled assets.",
        ],
      },
      {
        title: "Moderation and removal",
        body: [
          "AoTTG2 may review, hide, disable, quarantine, or remove a listing, URL, hosted file, comment, profile field, or account access when it appears to violate Workshop rules, safety requirements, or third-party rights.",
          "If a URL-backed file is hosted outside AoTTG2, disabling the Workshop listing does not remove that file from the external host. Rights holders may need to contact the external host directly.",
        ],
      },
      {
        title: "No warranty",
        body: [
          "The Workshop is provided as-is. AoTTG2 does not promise that user-submitted material is lawful, safe, available, compatible, accurate, complete, or free from third-party claims. Use community submissions at your own risk.",
        ],
      },
    ],
  },
  "content-rules": {
    intro: [
      "These rules apply to anything submitted to the Workshop, including listings, URLs, hosted maps, custom logic, addons, experiences, package files, previews, descriptions, tags, comments, and creator profile material.",
      "Core rule: submit only material you created or are authorized to share, link, host, display, moderate, and make available through the Workshop.",
    ],
    sections: [
      {
        title: "Allowed submissions",
        bullets: [
          "Original material created by the submitter.",
          "Material submitted with permission from the rights holder.",
          "Material under a compatible public license, with source and license information kept accurate.",
          "Public-domain or CC0 material where the status is reasonably verifiable.",
          "Commissioned material only when the artist or rights holder allowed the submitter to use it this way.",
        ],
      },
      {
        title: "Never submit",
        bullets: [
          "Ripped, extracted, decompiled, leaked, stolen, or directly ported assets.",
          "Paid marketplace, subscription, private, or commissioned assets used against their terms.",
          "Official promotional art, logos, screenshots, character renders, textures, models, sprites, audio, music, video, or other franchise material without permission.",
          "Another creator's work without permission.",
          "Maps, custom logic, addons, experiences, scripts, or packages that contain unauthorized bundled assets.",
          "Malware, exploit code, credential collection, hidden tracking, IP loggers, browser attacks, deceptive downloads, or moderation evasion.",
          "Material that impersonates an official AoTTG2 release, a moderator, another creator, or another project.",
          "Harassment, hate content, doxxing, threats, non-consensual private information, fraud, or unlawful material.",
        ],
      },
      {
        title: "External URL rules",
        bullets: [
          "Use stable HTTPS direct URLs from allowed hosts.",
          "Do not use private, expiring, tracking, redirecting, paywalled, credential-protected, or secret-containing URLs.",
          "The URL must point to the content described by the listing and must not rotate to unrelated material.",
          "The external host's terms must allow the way the file is linked, previewed, and retrieved.",
        ],
      },
      {
        title: "Hosted file rules",
        bullets: [
          "Hosted maps, custom logic, addons, experiences, and packages must be created by the uploader or submitted with permission.",
          "Everything inside the file must be authorized, including code, data, textures, models, audio, names, brands, and bundled assets.",
          "AoTTG2 may scan, reject, quarantine, disable, or delete hosted uploads. Passing a technical scan does not prove ownership, permission, safety, or legality.",
        ],
      },
      {
        title: "Listing text rules",
        bullets: [
          "Titles, descriptions, tags, source information, and creator names must be accurate and not misleading.",
          "Do not falsely claim ownership, permission, partnership, official status, or moderator approval.",
          "Do not use descriptions, tags, comments, or profile fields to route users to prohibited files.",
        ],
      },
    ],
  },
  "external-content": {
    intro: [
      "Many Workshop listings use external content. This notice explains what happens when a listing, preview, import action, or download points outside AoTTG2.",
    ],
    sections: [
      {
        title: "URL-backed skins and images",
        body: [
          "For URL-backed skins and images, AoTTG2 stores the listing information and submitted URL. The skin or image file remains on the external host. When users view, preview, import, or download it, their browser or game client may request the file from that external host.",
        ],
      },
      {
        title: "Preview providers",
        body: [
          "The Workshop may use technical image-preview providers, including thumb.gisketch.com, to resize or optimize previews. A preview provider may receive the submitted source URL and technical request information needed to provide the preview.",
        ],
      },
      {
        title: "What external hosts may receive",
        bullets: [
          "Your IP address or approximate network location.",
          "Browser, game client, device, or request metadata.",
          "The URL being requested and related referrer or timing information, depending on browser behavior.",
          "Cookies or account data only if you already have a relationship with that external host and the browser sends them.",
        ],
      },
      {
        title: "AoTTG2 limits",
        body: [
          "AoTTG2 does not control external hosts, their logs, uptime, cookies, retention, terms, safety practices, or whether content changes after submission. AoTTG2 may block or disable a Workshop listing or URL, but it usually cannot remove the original externally hosted file.",
        ],
      },
      {
        title: "Hosted Workshop files",
        body: [
          "Maps, custom logic, addons, experiences, and similar package files may be hosted by AoTTG2. These are still user-submitted materials. AoTTG2 may scan or moderate them, but the uploader remains responsible for the contents.",
        ],
      },
    ],
  },
  community: {
    intro: [
      "The Workshop is for community sharing. These guidelines apply to creators, commenters, reporters, moderators, and anyone using Workshop features.",
    ],
    sections: [
      {
        title: "Be accurate",
        bullets: [
          "Represent your work, source, permissions, and authorship honestly.",
          "Use tags and descriptions that help people find the right material.",
          "Do not claim official AoTTG2 status, moderator approval, or another creator's identity unless it is true.",
        ],
      },
      {
        title: "Respect creators and players",
        bullets: [
          "Do not harass, threaten, stalk, shame, or target people.",
          "Do not post private information, personal disputes, legal-notice details, or sensitive account information in public comments.",
          "Credit others when required by permission, license, or community expectation.",
        ],
      },
      {
        title: "Keep the Workshop usable",
        bullets: [
          "Do not spam duplicate listings, unrelated tags, misleading previews, or fake reports.",
          "Do not bypass removals by rotating URLs, renaming uploads, or reposting disabled material.",
          "Use report tools for rule problems instead of public callouts.",
        ],
      },
      {
        title: "Moderator actions",
        body: [
          "Moderators may hide, disable, restore, edit visibility, or escalate content based on Workshop rules and available evidence. Moderator action is not a legal judgment and does not guarantee that a submission is safe, authorized, or free from third-party claims.",
        ],
      },
    ],
  },
  "asset-usage": {
    intro: [
      "This guide explains what an uploader is saying when they submit material to the Workshop and what users should assume when importing or downloading it.",
    ],
    sections: [
      {
        title: "Uploader responsibility",
        body: [
          "By submitting a listing, URL, or hosted file, the uploader states that they created the material or have authorization to submit it, and that they are allowed to let AoTTG2 host, display, link, scan, moderate, and make it available through the Workshop.",
        ],
      },
      {
        title: "User permission",
        body: [
          "Unless a listing clearly states a broader valid license, Workshop material is for personal, non-commercial use in AoTTG2 only. Do not resell it, reupload it to another service, remove required credit, claim authorship, or use it outside the permission shown by the listing.",
        ],
      },
      {
        title: "Public licenses",
        body: [
          "A public license applies only to rights the licensor actually controls. Selecting a Creative Commons or similar license does not magically license third-party characters, logos, franchise designs, paid assets, private assets, or another creator's work.",
        ],
      },
      {
        title: "Official AoTTG2 material contact flag",
        body: [
          "A creator may choose to let the AoTTG2 team contact them about possible official use of a submission. This is only permission to contact the creator. It does not guarantee selection, payment, credit, acceptance, or official use, and official use may require a separate written permission or agreement.",
        ],
      },
      {
        title: "When in doubt",
        body: [
          "If you are not sure whether you have permission to submit or reuse something, do not publish it until you can verify the source and permission. Attribution, non-commercial intent, or the fact that something is available online is not enough by itself.",
        ],
      },
    ],
  },
  "report-ip": {
    intro: [
      "Use this page to report copyright, trademark, privacy, publicity, or other legal-rights concerns about Workshop listings, URLs, hosted files, creator profiles, or comments.",
      "You do not need to argue with the uploader publicly. Send a clear report so the AoTTG2 team can review the issue and, when appropriate, disable the Workshop listing, URL, or hosted file.",
    ],
    sections: [
      {
        title: "Include this information",
        bullets: [
          "Your name or organization and a way for the AoTTG2 team to contact you.",
          "The Workshop URL or enough information to identify the listing, hosted file, profile, or comment.",
          "A description of the work or right you believe is affected.",
          "The original source or official page for the work, if available.",
          "What action you want AoTTG2 to take.",
          "A statement that the information in your report is accurate to the best of your knowledge.",
        ],
      },
      {
        title: "Where to send it",
        body: [
          "Use the Workshop report flow when it is available. If a dedicated legal form is not connected yet, send the same information through the official AoTTG2 community contact channel or to an AoTTG2 team member responsible for Workshop moderation.",
        ],
      },
      {
        title: "What AoTTG2 may do",
        bullets: [
          "Review the listing, URL, hosted file, profile, or comment.",
          "Ask for more information when the report is unclear.",
          "Temporarily disable or remove Workshop access to the reported material.",
          "Preserve limited records needed for moderation, safety, repeat-infringer review, or dispute handling.",
        ],
      },
      {
        title: "External hosts",
        body: [
          "For URL-backed skins and images, AoTTG2 can disable the Workshop listing or URL, but the original file may still exist on the external host. If you need the external file removed from that host, contact that host directly.",
        ],
      },
      {
        title: "False or abusive reports",
        body: [
          "Do not submit knowingly false, abusive, impersonating, or retaliatory reports. Abuse of the report process may lead to account or moderation action.",
        ],
      },
    ],
  },
};

export function legalBodyForSlug(slug: LegalSlug) {
  return LEGAL_BODIES[slug];
}
