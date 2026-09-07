# TrueCopy — Privacy Policy

Last updated: 7 September 2026

TrueCopy is a tool that translates YouTube video titles and descriptions into other
languages, checks each translation against a set of deterministic rules, and publishes
only the translations that pass. This page explains exactly what data it touches.

Contact: realsid6@gmail.com

## What TrueCopy accesses

When you connect a YouTube channel, TrueCopy requests the `youtube.force-ssl` scope from
Google. It uses that access for three things and nothing else:

- **Reading your videos.** Video ids, titles, descriptions, thumbnails and the
  localizations already stored on each video.
- **Reading your channel.** The channel id and title, so the interface can show you which
  channel is connected.
- **Writing localized titles and descriptions.** Only when you explicitly start a live run,
  and only for the languages that pass the verification gate.

TrueCopy never reads or writes video files, comments, playlists, subscriber data or
analytics. It never deletes anything.

## What TrueCopy stores

- **Your Google OAuth token**, on the server's own disk, so the connection survives a page
  reload. It is stored against a random session identifier held in a cookie in your browser.
  It is not transmitted anywhere except to Google when refreshing access.
- **Run records**, as JSON files on the server. A run record contains the video ids, the
  source title and description, the generated translations, and which rules passed or
  failed. This is what the run history in the interface reads from.
- **A session cookie** named `tc_session`. It contains a random identifier only. It carries
  no personal data and is used solely to keep your connection separate from other visitors.

There is no analytics, no tracking, no advertising, and no third-party data sharing.

## Where your text goes

To translate, TrueCopy sends the video's title and description to Google's Gemini API.
That is the only outbound transfer of your content, and it happens only for videos you
select. Google's handling of that data is governed by the Google APIs Terms of Service and
Google's own privacy policy.

Nothing is sent to any other third party.

## Google user data and limited use

TrueCopy's use of information received from Google APIs adheres to the
[Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy),
including the Limited Use requirements. Data obtained through the YouTube Data API is used
only to provide the features described above, is not sold, is not used for advertising, and
is not transferred to others except as required to operate the service or comply with law.

By using TrueCopy you are also bound by the [YouTube Terms of Service](https://www.youtube.com/t/terms)
and the [Google Privacy Policy](https://policies.google.com/privacy).

## Revoking access

You can disconnect at any time from inside TrueCopy, which deletes the stored token for
your session. You can also revoke access directly from your Google Account at
[myaccount.google.com/permissions](https://myaccount.google.com/permissions), which
immediately invalidates the token regardless of what TrueCopy has stored.

## Deletion

Ask at the contact address above and any run records and stored token associated with your
channel will be deleted. Because run records are plain files on the server, deletion is
immediate and permanent.

## Status of this project

TrueCopy was built for a hackathon and is not a commercial service. It runs a demo channel
that visitors can explore read-only without connecting anything. It has no paid tier, no
accounts, and no user database beyond what is described above.

## Changes

If this policy changes, the date at the top of this file changes with it, and the history is
visible in the repository that hosts it.
