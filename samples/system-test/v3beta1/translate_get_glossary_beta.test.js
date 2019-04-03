/**
 * Copyright 2019, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const {assert} = require('chai');
const {TranslationServiceClient} = require('@google-cloud/translate').v3beta1;
const execa = require('execa');
const exec = async cmd => (await execa.shell(cmd)).stdout;

const REGION_TAG = 'translate_get_glossary_beta';

describe(REGION_TAG, () => {
  const translationClient = new TranslationServiceClient();
  const location = 'us-central1';
  const glossaryId = 'test-glossary';

  before(async function() {
    // Add a glossary to get
    const projectId = await translationClient.getProjectId();
    const glossary = {
      languageCodesSet: {
        languageCodes: ['en', 'es'],
      },
      inputConfig: {
        gcsSource: {
          inputUri: 'gs://cloud-samples-data/translation/glossary.csv',
        },
      },
      name: translationClient.glossaryPath(projectId, location, glossaryId),
    };

    // Construct request
    const request = {
      parent: translationClient.locationPath(projectId, location),
      glossary: glossary,
    };

    // Create glossary using a long-running operation.
    // You can wait for now, or get results later.
    const [operation] = await translationClient.createGlossary(request);

    // Wait for operation to complete.
    await operation.promise();
  });
  
  it('should get a glossary', async () => {
    const projectId = await translationClient.getProjectId();

    const output = await exec(
      `node v3beta1/${REGION_TAG}.js ${projectId} ${location} ${glossaryId}`
    );
    assert.match(output, /test-glossary/);
  });

  after(async function() {
    //delete the glossary we created
    const projectId = await translationClient.getProjectId();
    const name = translationClient.glossaryPath(
      projectId,
      location,
      glossaryId
    );
    const request = {
      parent: translationClient.locationPath(projectId, location),
      name: name,
    };

    // Delete glossary using a long-running operation.
    // You can wait for now, or get results later.
    const [operation] = await translationClient.deleteGlossary(request);

    // Wait for operation to complete.
    await operation.promise();
  });
});
