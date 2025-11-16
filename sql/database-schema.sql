CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users(
id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
email text NOT NULL UNIQUE,
display_name text,
avatar_url text,
created_at timestamptz DEFAULT NOW(),
updated_at timestamptz DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
FOR UPDATE
USING (auth.uid() = id);

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
AS $$
BEGIN
INSERT INTO public.users(id, email, display_name)
VALUES(NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'display_name')
ON CONFLICT (id) DO NOTHING;
RETURN NEW;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
AS $$
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;
$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_users ON public.users;
CREATE TRIGGER set_updated_at_users
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Community profiles table
CREATE TABLE IF NOT EXISTS public.community_profiles(
id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
username text NOT NULL UNIQUE,
display_name text NOT NULL,
bio text,
avatar_url text,
gender text,
posts_count integer DEFAULT 0,
followers_count integer DEFAULT 0,
following_count integer DEFAULT 0,
created_at timestamptz DEFAULT NOW(),
updated_at timestamptz DEFAULT NOW()
);

ALTER TABLE public.community_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view community profiles" ON public.community_profiles;
CREATE POLICY "Anyone can view community profiles" ON public.community_profiles
FOR SELECT
USING (TRUE);

DROP POLICY IF EXISTS "Users can create their own community profile" ON public.community_profiles;
CREATE POLICY "Users can create their own community profile" ON public.community_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own community profile" ON public.community_profiles;
CREATE POLICY "Users can update their own community profile" ON public.community_profiles
FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own community profile" ON public.community_profiles;
CREATE POLICY "Users can delete their own community profile" ON public.community_profiles
FOR DELETE
USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_updated_at_community_profiles ON public.community_profiles;
CREATE TRIGGER set_updated_at_community_profiles
BEFORE UPDATE ON public.community_profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Posts table
CREATE TABLE IF NOT EXISTS public.posts(
id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
author_id uuid NOT NULL REFERENCES public.community_profiles(id) ON DELETE CASCADE,
content text NOT NULL,
image_url text,
likes_count integer DEFAULT 0,
comments_count integer DEFAULT 0,
shares_count integer DEFAULT 0,
created_at timestamptz DEFAULT NOW(),
updated_at timestamptz DEFAULT NOW()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
CREATE POLICY "Anyone can view posts" ON public.posts
FOR SELECT
USING (TRUE);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
CREATE POLICY "Authenticated users can create posts" ON public.posts
FOR INSERT
WITH CHECK (
auth.uid() IS NOT NULL
AND EXISTS (
SELECT 1
FROM public.community_profiles
WHERE community_profiles.id = posts.author_id
AND community_profiles.user_id = auth.uid()
)
);

DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
CREATE POLICY "Users can update their own posts" ON public.posts
FOR UPDATE
USING (
EXISTS (
SELECT 1
FROM public.community_profiles
WHERE community_profiles.id = posts.author_id
AND community_profiles.user_id = auth.uid()
)
);

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
CREATE POLICY "Users can delete their own posts" ON public.posts
FOR DELETE
USING (
EXISTS (
SELECT 1
FROM public.community_profiles
WHERE community_profiles.id = posts.author_id
AND community_profiles.user_id = auth.uid()
)
);

DROP TRIGGER IF EXISTS set_updated_at_posts ON public.posts;
CREATE TRIGGER set_updated_at_posts
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Stories table
CREATE TABLE IF NOT EXISTS public.stories(
id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
author_id uuid NOT NULL REFERENCES public.community_profiles(id) ON DELETE CASCADE,
image_url text NOT NULL,
created_at timestamptz DEFAULT NOW(),
expires_at timestamptz NOT NULL
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active stories" ON public.stories;
CREATE POLICY "Anyone can view active stories" ON public.stories
FOR SELECT
USING (expires_at > NOW());

DROP POLICY IF EXISTS "Users can create their own stories" ON public.stories;
CREATE POLICY "Users can create their own stories" ON public.stories
FOR INSERT
WITH CHECK (
EXISTS (
SELECT 1
FROM public.community_profiles
WHERE community_profiles.id = stories.author_id
AND community_profiles.user_id = auth.uid()
)
);

DROP POLICY IF EXISTS "Users can delete their own stories" ON public.stories;
CREATE POLICY "Users can delete their own stories" ON public.stories
FOR DELETE
USING (
EXISTS (
SELECT 1
FROM public.community_profiles
WHERE community_profiles.id = stories.author_id
AND community_profiles.user_id = auth.uid()
)
);

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments(
id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
author_id uuid NOT NULL REFERENCES public.community_profiles(id) ON DELETE CASCADE,
content text NOT NULL,
likes_count integer DEFAULT 0,
created_at timestamptz DEFAULT NOW()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
CREATE POLICY "Anyone can view comments" ON public.comments
FOR SELECT
USING (TRUE);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments" ON public.comments
FOR INSERT
WITH CHECK (
auth.uid() IS NOT NULL
AND EXISTS (
SELECT 1
FROM public.community_profiles
WHERE community_profiles.id = comments.author_id
AND community_profiles.user_id = auth.uid()
)
);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
CREATE POLICY "Users can delete their own comments" ON public.comments
FOR DELETE
USING (
EXISTS (
SELECT 1
FROM public.community_profiles
WHERE community_profiles.id = comments.author_id
AND community_profiles.user_id = auth.uid()
)
);

-- Follows table
CREATE TABLE IF NOT EXISTS public.follows(
id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
follower_id uuid NOT NULL REFERENCES public.community_profiles(id) ON DELETE CASCADE,
following_id uuid NOT NULL REFERENCES public.community_profiles(id) ON DELETE CASCADE,
created_at timestamptz DEFAULT NOW(),
UNIQUE (follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;
CREATE POLICY "Anyone can view follows" ON public.follows
FOR SELECT
USING (TRUE);

DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
CREATE POLICY "Users can follow others" ON public.follows
FOR INSERT
WITH CHECK (
auth.uid() IS NOT NULL
AND EXISTS (
SELECT 1
FROM public.community_profiles
WHERE community_profiles.id = follows.follower_id
AND community_profiles.user_id = auth.uid()
)
);

DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;
CREATE POLICY "Users can unfollow" ON public.follows
FOR DELETE
USING (
EXISTS (
SELECT 1
FROM public.community_profiles
WHERE community_profiles.id = follows.follower_id
AND community_profiles.user_id = auth.uid()
)
);

-- Post likes table
CREATE TABLE IF NOT EXISTS public.post_likes(
id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
user_id uuid NOT NULL REFERENCES public.community_profiles(id) ON DELETE CASCADE,
created_at timestamptz DEFAULT NOW(),
UNIQUE (post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view post likes" ON public.post_likes;
CREATE POLICY "Anyone can view post likes" ON public.post_likes
FOR SELECT
USING (TRUE);

DROP POLICY IF EXISTS "Users can like posts" ON public.post_likes;
CREATE POLICY "Users can like posts" ON public.post_likes
FOR INSERT
WITH CHECK (
auth.uid() IS NOT NULL
AND EXISTS (
SELECT 1
FROM public.community_profiles
WHERE community_profiles.id = post_likes.user_id
AND community_profiles.user_id = auth.uid()
)
);

DROP POLICY IF EXISTS "Users can unlike posts" ON public.post_likes;
CREATE POLICY "Users can unlike posts" ON public.post_likes
FOR DELETE
USING (
EXISTS (
SELECT 1
FROM public.community_profiles
WHERE community_profiles.id = post_likes.user_id
AND community_profiles.user_id = auth.uid()
)
);

-- Saved posts table
CREATE TABLE IF NOT EXISTS public.saved_posts(
id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
user_id uuid NOT NULL REFERENCES public.community_profiles(id) ON DELETE CASCADE,
created_at timestamptz DEFAULT NOW(),
UNIQUE (post_id, user_id)
);

ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their saved posts" ON public.saved_posts;
CREATE POLICY "Users can view their saved posts" ON public.saved_posts
FOR SELECT
USING (
EXISTS (
SELECT 1
FROM public.community_profiles
WHERE community_profiles.id = saved_posts.user_id
AND community_profiles.user_id = auth.uid()
)
);

DROP POLICY IF EXISTS "Users can save posts" ON public.saved_posts;
CREATE POLICY "Users can save posts" ON public.saved_posts
FOR INSERT
WITH CHECK (
auth.uid() IS NOT NULL
AND EXISTS (
SELECT 1
FROM public.community_profiles
WHERE community_profiles.id = saved_posts.user_id
AND community_profiles.user_id = auth.uid()
)
);

DROP POLICY IF EXISTS "Users can unsave posts" ON public.saved_posts;
CREATE POLICY "Users can unsave posts" ON public.saved_posts
FOR DELETE
USING (
EXISTS (
SELECT 1
FROM public.community_profiles
WHERE community_profiles.id = saved_posts.user_id
AND community_profiles.user_id = auth.uid()
)
);

-- Story views table
CREATE TABLE IF NOT EXISTS public.story_views(
id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
viewed_at timestamptz DEFAULT NOW(),
UNIQUE (story_id, viewer_id)
);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own story views" ON public.story_views;
CREATE POLICY "Users can view their own story views" ON public.story_views
FOR SELECT
USING (
auth.uid() = viewer_id
OR EXISTS (
SELECT 1
FROM public.stories
WHERE stories.id = story_views.story_id
AND stories.author_id = (
SELECT id
FROM public.community_profiles
WHERE user_id = auth.uid()
)
)
);

DROP POLICY IF EXISTS "Users can mark stories as viewed" ON public.story_views;
CREATE POLICY "Users can mark stories as viewed" ON public.story_views
FOR INSERT
WITH CHECK (auth.uid() = viewer_id);

-- Notifications table (using migration definition)
CREATE TABLE IF NOT EXISTS public.notifications(
id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
recipient_id uuid NOT NULL REFERENCES public.community_profiles(id) ON DELETE CASCADE,
actor_id uuid REFERENCES public.community_profiles(id) ON DELETE SET NULL,
type text NOT NULL,
entity_id uuid,
read boolean DEFAULT FALSE,
created_at timestamptz DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT
USING (
recipient_id = (
SELECT id
FROM public.community_profiles
WHERE user_id = auth.uid()
)
);

DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
CREATE POLICY "Users can insert their own notifications" ON public.notifications
FOR INSERT
WITH CHECK (
recipient_id = (
SELECT id
FROM public.community_profiles
WHERE user_id = auth.uid()
)
);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE
USING (
recipient_id = (
SELECT id
FROM public.community_profiles
WHERE user_id = auth.uid()
)
);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications
FOR DELETE
USING (
recipient_id = (
SELECT id
FROM public.community_profiles
WHERE user_id = auth.uid()
)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_community_profiles_user_id ON public.community_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_community_profiles_username ON public.community_profiles(username);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_user_id ON public.saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON public.stories(author_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Functions & triggers for counts

-- update_post_likes_count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER
AS $$
BEGIN
IF TG_OP = 'INSERT' THEN
UPDATE public.posts
SET likes_count = COALESCE(likes_count, 0) + 1
WHERE id = NEW.post_id;
RETURN NEW;
ELSIF TG_OP = 'DELETE' THEN
UPDATE public.posts
SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
WHERE id = OLD.post_id;
RETURN OLD;
END IF;
RETURN NULL;
END;
$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_post_likes_count_trigger ON public.post_likes;
CREATE TRIGGER update_post_likes_count_trigger
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_post_likes_count();

-- update_post_comments_count
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER
AS $$
BEGIN
IF TG_OP = 'INSERT' THEN
UPDATE public.posts
SET comments_count = COALESCE(comments_count, 0) + 1
WHERE id = NEW.post_id;
RETURN NEW;
ELSIF TG_OP = 'DELETE' THEN
UPDATE public.posts
SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0)
WHERE id = OLD.post_id;
RETURN OLD;
END IF;
RETURN NULL;
END;
$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_post_comments_count_trigger ON public.comments;
CREATE TRIGGER update_post_comments_count_trigger
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_post_comments_count();

-- update_profile_posts_count
CREATE OR REPLACE FUNCTION public.update_profile_posts_count()
RETURNS TRIGGER
AS $$
BEGIN
IF TG_OP = 'INSERT' THEN
UPDATE public.community_profiles
SET posts_count = COALESCE(posts_count, 0) + 1
WHERE id = NEW.author_id;
RETURN NEW;
ELSIF TG_OP = 'DELETE' THEN
UPDATE public.community_profiles
SET posts_count = GREATEST(COALESCE(posts_count, 0) - 1, 0)
WHERE id = OLD.author_id;
RETURN OLD;
END IF;
RETURN NULL;
END;
$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profile_posts_count_trigger ON public.posts;
CREATE TRIGGER update_profile_posts_count_trigger
AFTER INSERT OR DELETE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_posts_count();

-- update_profile_follow_counts
CREATE OR REPLACE FUNCTION public.update_profile_follow_counts()
RETURNS TRIGGER
AS $$
BEGIN
IF TG_OP = 'INSERT' THEN
UPDATE public.community_profiles
SET following_count = COALESCE(following_count, 0) + 1
WHERE id = NEW.follower_id;

```
UPDATE public.community_profiles
SET followers_count = COALESCE(followers_count, 0) + 1
WHERE id = NEW.following_id;

RETURN NEW;
```

ELSIF TG_OP = 'DELETE' THEN
UPDATE public.community_profiles
SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0)
WHERE id = OLD.follower_id;

```
UPDATE public.community_profiles
SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0)
WHERE id = OLD.following_id;

RETURN OLD;
```

END IF;
RETURN NULL;
END;
$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profile_follow_counts_trigger ON public.follows;
CREATE TRIGGER update_profile_follow_counts_trigger
AFTER INSERT OR DELETE ON public.follows
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_follow_counts();

-- Storage buckets
INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
VALUES
('profile-avatars', 'profile-avatars', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg']::text[]),
('community-images', 'community-images', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg']::text[])
ON CONFLICT (id)
DO UPDATE SET
name = EXCLUDED.name,
public = EXCLUDED.public,
file_size_limit = EXCLUDED.file_size_limit,
allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies
DROP POLICY IF EXISTS "Public read profile avatars" ON storage.objects;
CREATE POLICY "Public read profile avatars" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'profile-avatars');

DROP POLICY IF EXISTS "Public read community images" ON storage.objects;
CREATE POLICY "Public read community images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'community-images');

DROP POLICY IF EXISTS "Authenticated upload profile avatars" ON storage.objects;
CREATE POLICY "Authenticated upload profile avatars" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-avatars');

DROP POLICY IF EXISTS "Authenticated upload community images" ON storage.objects;
CREATE POLICY "Authenticated upload community images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'community-images');

DROP POLICY IF EXISTS "Users update own files" ON storage.objects;
CREATE POLICY "Users update own files" ON storage.objects
FOR UPDATE TO authenticated
USING (auth.uid() = owner);

DROP POLICY IF EXISTS "Users delete own files" ON storage.objects;
CREATE POLICY "Users delete own files" ON storage.objects
FOR DELETE TO authenticated
USING (auth.uid() = owner);
