import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config();

export const CONFIG = {
  baseURL: process.env.INSAFLU_BASE_URL || 'https://insaflu.insa.pt/',
  username: process.env.INSAFLU_USERNAME,
  password: process.env.INSAFLU_PASSWORD,

  testDataPath: resolve(__dirname, '../../test-data'),
  sampleFilesPath: resolve(__dirname, '../../test-data/sample-files'),
  metadataTemplatesPath: resolve(__dirname, '../../test-data/metadata-templates'),

  timeouts: {
    upload: parseInt(process.env.UPLOAD_TIMEOUT || '600000'),
    processing: parseInt(process.env.PROCESSING_TIMEOUT || '300000'),
    project: parseInt(process.env.PROJECT_TIMEOUT || '600000'),
  },

  paths: {
    sarsOnt: resolve(__dirname, '../../test-data/sample-files/SARS_ONT'),
    influenzaIllumina: resolve(__dirname, '../../test-data/sample-files/influenza_illumina'),
    reference: resolve(__dirname, '../../test-data/sample-files/reference'),
  }
};

export const SAMPLE_FILES = {
  sarsOnt: [
    'SRR19847034.fastq.gz',
    'SRR19847193.fastq.gz',
    'SRR19847194.fastq.gz'
  ],
  influenzaIllumina: [
    { r1: 'influenza_01_1P.fastq.gz', r2: 'influenza_01_2P.fastq.gz', name: 'influenza_01' },
    { r1: 'influenza_02_1P.fastq.gz', r2: 'influenza_02_2P.fastq.gz', name: 'influenza_02' },
    { r1: 'influenza_03_1P.fastq.gz', r2: 'influenza_03_2P.fastq.gz', name: 'influenza_03' },
    { r1: 'influenza_04_1P.fastq.gz', r2: 'influenza_04_2P.fastq.gz', name: 'influenza_04' },
  ],
  reference: {
    fasta: 'NC004162.fasta',
    genbank: 'NC004162.gb'
  }
};

export const METADATA_FILES = {
  sarsOnt: 'sars_ont_batch.tsv',
  influenzaIllumina: 'influenza_illumina_batch.tsv',
  nextstrain: 'nextstrain_metadata.tsv'
};

export const SAMPLE_NAMES = {
  sarsOnt: [
    'amostra_SRR19847034',
    'amostra_SRR19847193',
    'amostra_SRR19847194'
  ],
  influenzaIllumina: [
    'influenza_01',
    'influenza_02',
    'influenza_03',
    'influenza_04'
  ]
};