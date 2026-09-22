CREATE TYPE "hubungan_keluarga" AS ENUM('Anak', 'Istri', 'Orang Tua', 'Kepala Keluarga', 'Cucu', 'Famili lain', 'Mertua', 'Menantu', 'Pembantu', 'Lainnya', 'Suami');--> statement-breakpoint
CREATE TYPE "jenis_kelamin" AS ENUM('laki-laki', 'perempuan');--> statement-breakpoint
CREATE TYPE "pendidikan" AS ENUM('SLTA/Sederajat', 'Tidak/Belum Sekolah', 'Belum Tamat SD/Sederajat', 'SLTP/Sederajat', 'Strata III', 'Diploma IV/Strata I', 'Akademi/Diploma III/ Sarjana Muda', 'Tamat SD/Sederajat', 'Strata-II');--> statement-breakpoint
CREATE TYPE "status_kawin" AS ENUM('belum kawin', 'kawin', 'cerai mati', 'cerai hidup');--> statement-breakpoint
CREATE TABLE "data_warga" (
	"nik" integer PRIMARY KEY,
	"nama_art" varchar(255) NOT NULL,
	"nama_kk" varchar(255) NOT NULL,
	"hubungan_keluarga" "hubungan_keluarga" NOT NULL,
	"alamat" text NOT NULL,
	"tgl_lahir" date NOT NULL,
	"rt" integer NOT NULL,
	"rw" integer NOT NULL,
	"kecamatan" text NOT NULL,
	"kelurahan" text NOT NULL,
	"kota" text NOT NULL,
	"status_kawin" "status_kawin" NOT NULL,
	"petugas" text NOT NULL,
	"jenis_kelamin" "jenis_kelamin" NOT NULL,
	"wanita_usia_hamil" boolean NOT NULL,
	"agama" text NOT NULL,
	"pendidikan" "pendidikan" NOT NULL,
	"pekerjaan" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "riwayat_survey" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "riwayat_survey_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nama" varchar(255) NOT NULL,
	"tgl_survei" date NOT NULL,
	"nik_warga" integer,
	"iks_inti" numeric NOT NULL,
	"iks_besar" numeric NOT NULL,
	"petugas_id" integer,
	"jumlah_art_di_wawancara" integer NOT NULL,
	"ada_air_bersih" boolean NOT NULL,
	"sumber_air_terlindung" boolean NOT NULL,
	"ada_jamban_keluarga" boolean NOT NULL,
	"jamban_saniter" boolean NOT NULL,
	"ada_art_gangguan_jiwa" boolean NOT NULL,
	"minum_obat_gangguan_jiwa_teratur" boolean NOT NULL,
	"ada_art_dipasung" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "surveyor" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "surveyor_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nama" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "riwayat_survey" ADD CONSTRAINT "riwayat_survey_nik_warga_data_warga_nik_fkey" FOREIGN KEY ("nik_warga") REFERENCES "data_warga"("nik");--> statement-breakpoint
ALTER TABLE "riwayat_survey" ADD CONSTRAINT "riwayat_survey_petugas_id_surveyor_id_fkey" FOREIGN KEY ("petugas_id") REFERENCES "surveyor"("id");