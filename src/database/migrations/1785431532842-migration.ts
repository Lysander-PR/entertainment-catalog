import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1785431532842 implements MigrationInterface {
    name = 'Migration1785431532842'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "albums" DROP COLUMN "created_at"`);
    }

}
