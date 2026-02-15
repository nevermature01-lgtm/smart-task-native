


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_team_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_code text;
BEGIN
  LOOP
    new_code := LPAD((floor(random() * 1000000))::text, 6, '0');
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.teams WHERE code = new_code
    );
  END LOOP;
  RETURN new_code;
END;
$$;


ALTER FUNCTION "public"."generate_team_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_team_member"("team_id_to_check" "uuid", "user_id_to_check" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.team_members
        WHERE team_id = team_id_to_check AND user_id = user_id_to_check
    );
$$;


ALTER FUNCTION "public"."is_team_member"("team_id_to_check" "uuid", "user_id_to_check" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_team_code"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := generate_team_code();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_team_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "email" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'Public profile information for each user.';



CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text",
    "creator_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_user_id_key" UNIQUE ("team_id", "user_id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "before_insert_team_code" BEFORE INSERT ON "public"."teams" FOR EACH ROW EXECUTE FUNCTION "public"."set_team_code"();



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "id" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Allow authenticated read profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to create their own teams" ON "public"."teams" FOR INSERT WITH CHECK (("creator_id" = "auth"."uid"()));



CREATE POLICY "Allow authenticated users to read all profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow insert own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Allow member selection for fellow team members" ON "public"."team_members" FOR SELECT TO "authenticated" USING ("public"."is_team_member"("team_id", "auth"."uid"()));



CREATE POLICY "Allow members to see other members of their own teams" ON "public"."team_members" FOR SELECT USING (("team_id" IN ( SELECT "team_members_1"."team_id"
   FROM "public"."team_members" "team_members_1"
  WHERE ("team_members_1"."user_id" = "auth"."uid"()))));



CREATE POLICY "Allow team creators to insert new members" ON "public"."team_members" FOR INSERT WITH CHECK ((( SELECT "teams"."creator_id"
   FROM "public"."teams"
  WHERE ("teams"."id" = "team_members"."team_id")) = "auth"."uid"()));



CREATE POLICY "Allow team selection for members and creators" ON "public"."teams" FOR SELECT TO "authenticated" USING ((("creator_id" = "auth"."uid"()) OR "public"."is_team_member"("id", "auth"."uid"())));



CREATE POLICY "Allow update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Enable read access for team members or creators" ON "public"."teams" FOR SELECT USING ((("creator_id" = "auth"."uid"()) OR ("id" IN ( SELECT "team_members"."team_id"
   FROM "public"."team_members"
  WHERE ("team_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create teams" ON "public"."teams" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "creator_id"));



CREATE POLICY "Users can delete own teams" ON "public"."teams" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "creator_id"));



CREATE POLICY "Users can join teams" ON "public"."team_members" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their teams" ON "public"."teams" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "creator_id") OR (EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."team_id" = "teams"."id") AND ("team_members"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT ALL ON SCHEMA "public" TO "anon";
GRANT ALL ON SCHEMA "public" TO "authenticated";




