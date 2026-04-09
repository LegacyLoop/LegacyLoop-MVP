---
name: platform-publishing-standards
description: Launch strategy per platform for maximum reach, covering optimal posting times, cross-platform content sequencing, per-platform metadata output format, future social API integration prep, and the complete definition of publish-ready status for each platform VideoBot supports.
when_to_use: "Every VideoBot scan."
version: 1.0.0
---

# Platform Publishing Standards

## Why Publishing Standards Are Part of the Script Output

A GOLD script published at 3am on a Tuesday to the wrong audience with the wrong hashtags will underperform a SILVER script published at the right time, to the right group, with the right metadata. Publishing standards are not a post-production afterthought. They are integral to the script's performance.

VideoBot generates complete publish-ready packages — not just script text. Every output includes optimal posting time, platform-specific caption, hashtag set, CTA, aspect ratio, duration target, and content policy compliance notes for each platform. The seller should be able to read the output and post to every platform without making a single additional creative decision.

## Optimal Posting Times by Platform

All times are expressed in the seller's local time zone. VideoBot should surface the seller's ZIP code time zone from their profile, not default to UTC.

TikTok: The TikTok For You Page algorithm serves content across time zones asynchronously, but initial distribution favors the creator's most active posting window. Optimal windows for resale and collectible content: 7am-9am (morning scroll before work), 12pm-3pm (lunch hour), and 7pm-11pm (evening session). The 7pm-11pm window generates the highest engagement volume for discovery content. Estate sale and antique content specifically performs best between 8pm-10pm when the core 35-60 demographic is scrolling.

Instagram Reels: Instagram's algorithm is less time-sensitive than TikTok's because the Reels feed is curated differently, but posting timing still affects early engagement velocity which influences broader distribution. Optimal windows: 11am-1pm and 7pm-9pm. Saturday morning from 9am-11am is the strongest single window for estate and antique resale content on Instagram, as this overlaps with the physical estate sale attendance window for users who could not attend in person.

YouTube Shorts: YouTube Shorts benefits from longer content shelf life than TikTok or Instagram — a well-performing Short continues to generate views for weeks. However, initial posting time still affects early momentum. Optimal windows: 2pm-4pm and 6pm-9pm. Shorts posted mid-afternoon benefit from the school-out and post-work browsing wave. Weekend posting between 10am and 2pm captures the highest volume of leisure browsing time.

Facebook Video: Facebook's core demographic for estate sale and antique resale content skews older (45-65) than TikTok or Instagram. This demographic's peak platform usage times are 1pm-4pm and 6pm-8pm on weekdays. Sunday afternoon between 1pm and 5pm is the highest-engagement window for this demographic on Facebook specifically for buying-intent content.

## Cross-Platform Content Sequencing

One video, four platforms, maximum total reach. The sequencing strategy staggers publication across platforms to maximize the lifetime reach of a single piece of content.

Step 1: TikTok (Day 1, optimal posting window)

Post to TikTok first. TikTok has the fastest viral loop of any platform — a video can reach 10,000 views within 6 hours if early signals are strong. TikTok also attracts the youngest, largest discovery audience. Posting here first allows the seller to read early engagement signals before the video reaches other platforms.

Caption for TikTok: Punchy, first-person, uses the item-specific hook from the script. 150 characters or fewer. 3-5 hashtags. CTA as the final line.

Step 2: Instagram Reels (Day 1, 2 hours after TikTok post)

Post the same video to Instagram Reels two hours after the TikTok post. The two-hour gap allows TikTok early engagement to register without competing with itself. The Instagram Reels audience partially overlaps with TikTok but captures a different demographic segment — higher household income, more likely to be in the 30-50 range, more purchase-ready for higher-value items.

Caption for Instagram: More detailed than TikTok. Can extend to 300 characters. Include a provenance or authenticity note that collectors on Instagram value. 8-15 hashtags in the first comment. CTA with item-specific keyword.

Step 3: YouTube Shorts (Day 2)

Post the same video as a YouTube Short the following day. YouTube Shorts reach a search-driven audience that TikTok and Instagram do not fully capture. A viewer who has been actively searching for a "1967 Mustang Fastback for sale" or "Stickley furniture estate sale" will find the YouTube Short in search results weeks after posting, where TikTok and Instagram content has already scrolled into irrelevance.

Caption for YouTube: Title should include the item name, key identifier, and transaction intent keyword. "1967 Mustang Fastback Matching Numbers For Sale — Barn Find Maine." Description includes the full item details in text form, 3-5 relevant tags, and the listing link. #Shorts is the first tag.

Step 4: Facebook Video (Day 3)

Post to Facebook Video and the most relevant Facebook group on the third day. By this point, TikTok and Instagram have completed their primary engagement cycle. Facebook's audience is different: older, more local, more likely to be in the seller's immediate geography. The Facebook post should be written in Facebook's native register — longer caption, more context, no TikTok slang, direct PM CTA.

The group targeting decision: post to the single most relevant group, not every group available. Posting the same video to twelve groups simultaneously triggers Facebook's spam detection and reduces distribution. Post to the best group first. If there is no engagement within 48 hours, move to the second-best group.

## How to Maximize Reach from One Video

The same video content, reformatted with platform-specific metadata, can reach four distinct audience segments with minimal additional effort. The reformatting effort per platform is 5-10 minutes per platform if the VideoBot publish-ready package is complete.

The four variables that change per platform:
1. Caption (length, register, content emphasis)
2. Hashtags (count, size tier, category relevance)
3. CTA (platform-native format)
4. Posting time (platform-specific optimal window)

The video itself does not change. The thumbnail may need adjustment for YouTube (horizontal crop vs vertical crop). The aspect ratio must be 9:16 vertical for TikTok, Reels, and Shorts. Facebook Video accepts 9:16 but also performs well at 4:5 if the content was not originally shot vertical.

## Future Social Publishing API Integration

When the following APIs are wired into LegacyLoop's backend, VideoBot will auto-publish from the seller's account on their behalf:

TikTok for Developers (TikTok Content Posting API): Supports direct video upload and post creation. Requires user OAuth authentication. Rate limits apply. Supports caption, hashtags, and privacy setting.

Instagram Graph API (Reels Publishing): Meta's API supports Reels publication through a two-step process (upload container, then publish). Requires Business or Creator account. Caption and hashtag are set at publish time.

YouTube Data API v3 (Videos.insert): Supports direct video upload with title, description, tags, and category. Shorts are classified by aspect ratio and duration at the platform level, not by API parameter.

Facebook Graph API (Video.publish): Supports video post creation to pages and groups. Group posting requires group admin approval in some configurations.

Until these APIs are wired, VideoBot outputs a complete per-platform metadata package that the seller can use to post manually with zero guesswork. The goal is to make manual posting take less than 5 minutes per platform.

## The VideoBot Publish-Ready Package Format

Every VideoBot output that achieves SILVER confidence or above produces a publish-ready package in the following structure:

Platform: [TIKTOK / INSTAGRAM / YOUTUBE / FACEBOOK]
Caption: [Full caption text, character count noted]
Hashtags: [Complete hashtag set, placement instruction (caption vs first comment)]
CTA: [Exact CTA text as it appears at the end of the script]
Optimal posting time: [Day and time window in seller's local time zone]
Aspect ratio: [9:16 vertical recommended / 4:5 acceptable]
Duration target: [Platform maximum and recommended duration range]
Content policy notes: [Any item-specific policy flags]

This package is generated for all four platforms simultaneously. The seller receives a complete four-platform publishing plan as part of the standard VideoBot script output.

## What Publish-Ready Means Per Platform

Publish-ready is a defined state, not a subjective judgment. Each platform has specific criteria.

TikTok publish-ready criteria:
- Script complete and achieves SILVER or higher confidence
- Duration: 15-60 seconds for resale content (30-45 seconds optimal)
- Aspect ratio: 9:16 vertical
- Hashtags: 3-5 selected and formatted
- CTA: TikTok-native format (comment or DM keyword)
- Optimal posting time: identified
- Content policy: no prohibited price claims, no medical/legal/financial advice, no unsubstantiated condition claims

Instagram Reels publish-ready criteria:
- Script complete and achieves SILVER or higher confidence
- Duration: 15-90 seconds (30-60 seconds optimal for resale content)
- Aspect ratio: 9:16 vertical (4:5 acceptable but not optimal for Reels)
- Hashtags: 8-15 selected, formatted for first-comment placement
- CTA: Instagram-native format (DM keyword or save/share prompt)
- Optimal posting time: identified
- Caption: Under 300 characters, professional register, no hashtag dump in caption

YouTube Shorts publish-ready criteria:
- Script complete and achieves SILVER or higher confidence
- Duration: under 60 seconds
- Aspect ratio: 9:16 vertical (required for Shorts classification)
- Title: includes item name, key identifier, transaction keyword — under 100 characters
- Description: full item details in text, 3-5 tags, listing link, #Shorts as first tag
- Thumbnail: clear item shot, readable at small size
- Content policy: no prohibited price claims, no misleading authenticity claims, no regulated item categories (weapons, certain pharmaceuticals, etc.)

Facebook Video publish-ready criteria:
- Script complete and achieves SILVER or higher confidence
- Duration: 30-120 seconds (Facebook's older demographic tolerates longer content)
- Aspect ratio: 9:16 or 4:5
- Caption: 2-4 sentences, Facebook register (no TikTok slang), complete context, PM CTA
- Hashtags: 2-3 maximum
- Target group: identified by category and geography
- Content policy: no prohibited items (Facebook Marketplace policy applies to group posts), no solicitation language that violates group rules

## Content Policy Compliance Baseline

All platforms prohibit or restrict certain claims, item categories, and language patterns. VideoBot checks scripts against the following baseline before outputting a publish-ready package.

Prohibited claim types across all platforms:
- Specific medical, legal, or financial advice ("this coin is a better investment than stocks")
- Unverifiable authenticity claims stated as fact rather than assessment ("this is definitely Tiffany" when authentication is uncertain)
- Reproduction items represented as originals
- Weapons, firearms, or regulated items requiring licensed dealer transactions

Platform-specific flags:
- TikTok: Age-restricted items (alcohol, tobacco memorabilia with specific brand claims) require disclosure
- Instagram: Sponsored content disclosure required if seller has any commercial relationship with item source
- YouTube: Items associated with gambling (certain card grading content) may trigger restricted status
- Facebook: Items on the Marketplace prohibited list are also prohibited in group posts — this includes certain vehicle parts, recalled items, and medical devices

When VideoBot detects a potential policy flag, it surfaces the flag in the publish-ready package and recommends specific language adjustment rather than blocking publication. The seller makes the final compliance decision.
