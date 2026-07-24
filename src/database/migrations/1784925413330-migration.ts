import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1784925413330 implements MigrationInterface {
    name = 'Migration1784925413330'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_rol_enum" AS ENUM('admin', 'user')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(50) NOT NULL, "username" character varying(30) NOT NULL, "password" text NOT NULL, "verified" boolean NOT NULL DEFAULT false, "rol" "public"."user_rol_enum" NOT NULL DEFAULT 'user', "active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "books" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "author" character varying(30) NOT NULL, "co_writer" character varying(30), "title" character varying(50) NOT NULL, "release_date" date NOT NULL, "active" boolean NOT NULL DEFAULT true, "publisher" character varying(50) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "cover_id" uuid, CONSTRAINT "REL_21de0111c807dda0f67ea54539" UNIQUE ("cover_id"), CONSTRAINT "PK_f3f2f25a099d24e12545b70b022" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "movies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "director" character varying(30) NOT NULL, "title" character varying(30) NOT NULL, "writer" character varying(30) NOT NULL, "studio" character varying(20) NOT NULL, "protagonist" character varying(30) NOT NULL, "release_date" date NOT NULL, "soundtrack" text, "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "poster_id" uuid, CONSTRAINT "REL_232b69c5592a16d8db369d0704" UNIQUE ("poster_id"), CONSTRAINT "PK_c5b2c134e871bfd1c2fe7cc3705" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "covers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "file" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_99b1572dfa31a647e087269734c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "albums" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "album" character varying(100) NOT NULL, "release_date" date NOT NULL, "studio" character varying(50) NOT NULL, "artist" character varying(50) NOT NULL, "active" boolean NOT NULL DEFAULT true, "cover_id" uuid, CONSTRAINT "UQ_c34768eaddbeb05b360a2a670ab" UNIQUE ("album"), CONSTRAINT "REL_5c439322115d13b074d2e5d262" UNIQUE ("cover_id"), CONSTRAINT "PK_838ebae24d2e12082670ffc95d7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "genres" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "genre" character varying(50) NOT NULL, CONSTRAINT "UQ_778e59ce8961a0c7c8e6534f128" UNIQUE ("genre"), CONSTRAINT "PK_80ecd718f0f00dde5d77a9be842" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "songs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "composer" character varying(30) NOT NULL DEFAULT '', "guest_artist" character varying(30), "title" character varying(50) NOT NULL, "active" boolean NOT NULL DEFAULT true, "album_id" uuid NOT NULL, "genre_id" uuid NOT NULL, CONSTRAINT "PK_e504ce8ad2e291d3a1d8f1ea2f4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "books" ADD CONSTRAINT "FK_21de0111c807dda0f67ea54539a" FOREIGN KEY ("cover_id") REFERENCES "covers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movies" ADD CONSTRAINT "FK_232b69c5592a16d8db369d07043" FOREIGN KEY ("poster_id") REFERENCES "covers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "albums" ADD CONSTRAINT "FK_5c439322115d13b074d2e5d2623" FOREIGN KEY ("cover_id") REFERENCES "covers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "songs" ADD CONSTRAINT "FK_944f44ec5e875219d05bb81d966" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "songs" ADD CONSTRAINT "FK_622ffe28923ae45eb97ce536694" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "songs" DROP CONSTRAINT "FK_622ffe28923ae45eb97ce536694"`);
        await queryRunner.query(`ALTER TABLE "songs" DROP CONSTRAINT "FK_944f44ec5e875219d05bb81d966"`);
        await queryRunner.query(`ALTER TABLE "albums" DROP CONSTRAINT "FK_5c439322115d13b074d2e5d2623"`);
        await queryRunner.query(`ALTER TABLE "movies" DROP CONSTRAINT "FK_232b69c5592a16d8db369d07043"`);
        await queryRunner.query(`ALTER TABLE "books" DROP CONSTRAINT "FK_21de0111c807dda0f67ea54539a"`);
        await queryRunner.query(`DROP TABLE "songs"`);
        await queryRunner.query(`DROP TABLE "genres"`);
        await queryRunner.query(`DROP TABLE "albums"`);
        await queryRunner.query(`DROP TABLE "covers"`);
        await queryRunner.query(`DROP TABLE "movies"`);
        await queryRunner.query(`DROP TABLE "books"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_rol_enum"`);
    }

}
