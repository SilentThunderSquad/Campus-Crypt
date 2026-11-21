import test from 'node:test';
import assert from 'node:assert/strict';
import { createPhase3FixtureSet } from './fixtures/phase3-fixtures.js';
import { createPost, updateOwnPost } from '../src/services/postService.js';
import { createComment, getCommentsForPost } from '../src/services/discussionService.js';
import { getFeedForUniversity } from '../src/services/communityFeedService.js';

test('Phase 3 posts and bounded replies use database identity and preserve public serialization', async () => {
  const fixture = await createPhase3FixtureSet({ label: 'posts-comments' });
  try {
    const post = await createPost({
      universitySlug: fixture.university.slug,
      userId: fixture.user.id,
      content: 'A verified standalone post',
    });
    const comment = await createComment({
      universitySlug: fixture.university.slug,
      postId: post.id,
      userId: fixture.secondaryUser.id,
      content: 'An authenticated unverified reply',
    });
    const nested = await createComment({
      universitySlug: fixture.university.slug,
      postId: post.id,
      parentCommentId: comment.id,
      userId: fixture.user.id,
      content: 'A bounded nested reply',
    });

    const comments = await getCommentsForPost({
      universitySlug: fixture.university.slug,
      postId: post.id,
    });
    assert.equal(comments.length, 1);
    assert.equal(comments[0].replies[0].id, nested.id);
    assert.equal(comments[0].author.id, fixture.secondaryUser.id);
    assert.equal(comments[0].author.email, undefined);
    assert.equal(comments[0].author.supabaseUserId, undefined);
    assert.equal(comments[0].author.role, undefined);

    const feed = await getFeedForUniversity({ universitySlug: fixture.university.slug, user: null });
    assert.equal(feed.items[0].id, post.id);
    assert.equal(feed.items[0].comments[0].id, comment.id);
    assert.equal(feed.items[0].author.email, undefined);
  } finally {
    await fixture.cleanup();
  }
});

test('Phase 3 rejects unverified standalone posts, mismatched parents, and non-owner edits', async () => {
  const fixture = await createPhase3FixtureSet({ label: 'posts-authorization' });
  const otherFixture = await createPhase3FixtureSet({ label: 'posts-other-university' });
  try {
    await assert.rejects(
      createPost({
        universitySlug: fixture.university.slug,
        userId: fixture.secondaryUser.id,
        content: 'Should not be a standalone post',
      }),
      (error) => error.status === 403,
    );

    const post = await createPost({
      universitySlug: fixture.university.slug,
      userId: fixture.user.id,
      content: 'Owned post',
    });
    const otherPost = await createPost({
      universitySlug: otherFixture.university.slug,
      userId: otherFixture.user.id,
      content: 'Other university post',
    });
    const parent = await createComment({
      universitySlug: fixture.university.slug,
      postId: post.id,
      userId: fixture.secondaryUser.id,
      content: 'Valid parent',
    });

    await assert.rejects(
      createComment({
        universitySlug: otherFixture.university.slug,
        postId: otherPost.id,
        parentCommentId: parent.id,
        userId: otherFixture.secondaryUser.id,
        content: 'Cross-university guessed parent',
      }),
      (error) => error.status === 400,
    );
    await assert.rejects(
      updateOwnPost({ universitySlug: fixture.university.slug, postId: post.id, userId: fixture.secondaryUser.id, content: 'IDOR attempt' }),
      (error) => error.status === 403,
    );
    const updated = await updateOwnPost({ universitySlug: fixture.university.slug, postId: post.id, userId: fixture.user.id, content: 'Edited by owner' });
    assert.equal(updated.content, 'Edited by owner');
  } finally {
    await otherFixture.cleanup();
    await fixture.cleanup();
  }
});
