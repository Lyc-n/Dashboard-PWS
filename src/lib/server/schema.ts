import { date, integer, pgTable, pgEnum,text, varchar } from "drizzle-orm/pg-core";


export const statusKawinEnum = pgEnum('status_kawin', ['belum kawin', 'kawin', 'cerai mati', 'cerai hidup']);
export const jenisKelaminEnum = pgEnum('jenis_kelamin', ['laki-laki', 'perempuan']);
export const hubunganKeluargaEnum = pgEnum('hubungan_keluarga',
            ['Anak', 'Istri', 'Orang Tua', 'Kepala Keluarga',
             'Cucu', 'Famili lain', 'Mertua', 'Menantu',
             'Pembantu', 'Lainnya', 'Suami'
            ]);
export const pendidikanEnum = pgEnum('pendidikan', 
            ['SLTA/Sederajat', 'Tidak/Belum Sekolah', 'Belum Tamat SD/Sederajat',
             'SLTP/Sederajat', 'Strata III', 'Diploma IV/Strata I', 'Akademi/Diploma III/ Sarjana Muda',
             'Tamat SD/Sederajat', 'Strata-II'
            ]);

export const dataWargaTable = pgTable("data_warga", {
    // id: integer().primaryKey().generatedAlwaysAsIdentity(),
    nik: integer().notNull().primaryKey(),
    nama_art: varchar({ length: 255 }).notNull(),
    nama_kk: varchar({ length: 255 }).notNull(),
    hubungan_keluarga: hubunganKeluargaEnum().notNull(),
    alamat:text().notNull(),
    tgl_lahir: date().notNull(),
    rt: integer().notNull(),
    rw: integer().notNull(),
    kecamatan: text().notNull(),
    kelurahan: text().notNull(),
    kota: text().notNull(),
    status_kawin: statusKawinEnum().notNull(),
    petugas: text().notNull(),
    jenis_kelamin: jenisKelaminEnum().notNull(),
    agama: text().notNull(),
    pendidikan: pendidikanEnum().notNull(),
    pekerjaan: text().notNull(),
});

export const surveyor = pgTable("surveyor", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    nama: varchar({ length: 255 }).notNull(),
});

export const riawaySurvey = pgTable("riwayat_survey", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    nama: varchar({ length: 255 }).notNull(),
    
});