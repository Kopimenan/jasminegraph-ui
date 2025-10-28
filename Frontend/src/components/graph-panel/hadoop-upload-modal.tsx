/**
Copyright 2024 JasmineGraph Team
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */

'use client';
import React, { useEffect, useState } from 'react';
import { Modal, List, Button, Radio, Form, message } from 'antd';
import axios from "axios";

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
}

type HadoopItem = {
    pathSuffix: string;
    type: 'FILE' | 'DIRECTORY';
};

const HadoopUploadModal = ({open, setOpen}:Props) => {

    const [connectionData, setConnectionData] = useState({
        ip: '',
        port: '9000',
        uiPort: '9870',
        path: '/home',
    });
    const [connected, setConnected] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const [fileData, setFileData] = useState<HadoopItem[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        setSelectedFile(null);
    }, [fileData]);

    const handleCancel = () => {
        setOpen(false);
        setStep(1);
        setSelectedFile(null);
        setFileData([]);
        setConnectionData({ ip: '',port: '9000', uiPort: '9870', path: '/home' });
        setConnected(false);
        setAnswers({});
    };

    const handleConnect = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const target = e.target as typeof e.target & {
            ip: { value: string };
            uiPort: { value: string };
            path: { value: string }
        };
        const clusterId = localStorage.getItem('selectedCluster') || '';
        setFileData([]);
        try {
            const res = await fetch(`backend/graph/hadoop?ip=${encodeURIComponent(connectionData.ip)}&uiPort=${encodeURIComponent(connectionData.uiPort)}&path=${encodeURIComponent(connectionData.path)}`, {
                method: 'GET',
                headers: {'Cluster-ID': clusterId}
            });
            const data = await res.json();
            console.log(data);
            setFileData(data);
            setConnected(true);
        }
        catch (err){
            console.error('Connection failed:', err);
            setConnected(false);
        }
    };

    const handleNext = () => {
        if (!selectedFile) return;
        setStep(2);
    };

    const handleBack = () => {
        setStep(1);
    };
    const handleUpload = () => {
        console.log('Uploading file:', selectedFile);
        console.log('User answers:', answers);
        axios.post('/backend/graph/hadoop-upload', {
            hadoopIp: connectionData.ip,
            hadoopPort: connectionData.port,
            hadoopFilePath: connectionData.path + "/" + selectedFile,
            isEdgeList: answers.isEdgeList,
            isDirected: answers.isDirected  }, {
            headers: { 'Cluster-ID': localStorage.getItem('selectedCluster') }
        }).then(response => {
            message.success("File uploaded successfully");
        })
            .catch(error => {
                // console.log('error');
                message.error("Failed to upload file");
            });

        setOpen(false);
        setStep(1);
    };



  return (
      <Modal title="Hadoop HDFS" open={open} onCancel={handleCancel} width={800} footer={
          connected && step === 1 ? (
              <Button
                  type="primary"
                  style={{ marginTop: '16px' }}
                  disabled={!selectedFile}
                  onClick={handleNext}
              >
                  Next
              </Button>
          ) : null
      }>
          {step === 1 && (
              <>
                  <form onSubmit={handleConnect}>
                      <label>
                          IP:
                          <input name="ip" type="text" required value={connectionData.ip}
                                 onChange={(e) =>
                                     setConnectionData((prev) => ({ ...prev, ip: e.target.value }))
                                 }/>
                      </label>
                      <label>
                          Port:
                          <input name="port" type="number" required value={connectionData.port}
                                 onChange={(e) =>
                                     setConnectionData((prev) => ({ ...prev, port: e.target.value }))
                                 }/>
                      </label>
                      <br/>
                      <label>
                          webhdfs UI Port:
                          <input name="port" type="number" required value={connectionData.uiPort}
                                 onChange={(e) =>
                                     setConnectionData((prev) => ({ ...prev, port: e.target.value }))
                                 }/>
                      </label>
                      <label>
                          Path:
                          <input name="path" type="text" required value={connectionData.path}
                                 onChange={(e) =>
                                     setConnectionData((prev) => ({ ...prev, path: e.target.value }))
                                 }/>
                      </label>
                      <Button
                          htmlType="submit"
                          style={{
                              backgroundColor: '#b0b0b0', // ash gray
                              color: 'white',
                              border: 'none',
                              marginTop: '8px',
                          }}
                      >
                          Connect
                      </Button>
                  </form>

                  {fileData.length > 0 && (
                      <div style={{maxHeight: '200px', overflowY: 'auto', marginTop: '16px'}}>
                          <Radio.Group
                              onChange={(e) => setSelectedFile(e.target.value)}
                              value={selectedFile}
                              style={{width: '100%'}}
                          >
                              <List
                                  dataSource={fileData}
                                  renderItem={(item) => (
                                      <List.Item>
                                          {item.type === 'FILE' ? (
                                              <Radio value={item.pathSuffix}>{item.pathSuffix}</Radio>
                                          ) : (
                                              <span style={{fontWeight: 500}}>
                                            📁 {item.pathSuffix}
                                        </span>
                                          )}
                                      </List.Item>
                                  )}
                              />
                          </Radio.Group>

                      </div>
                  )}
              </>
          )}
          {step === 2 && (
              <div style={{ marginTop: '16px' }}>
                  <h3>Upload Details</h3>
                  <Form layout="vertical">
                      <Form.Item label="Is edge list type graph?">
                          <Radio.Group
                              onChange={(e) =>
                                  setAnswers((prev) => ({
                                      ...prev,
                                      isEdgeList: e.target.value,
                                  }))
                              }
                              value={answers.isEdgeList}
                          >
                              <Radio value="y">Yes</Radio>
                              <Radio value="n">No</Radio>
                          </Radio.Group>
                      </Form.Item>
                      <Form.Item label="Is the graph directed?">
                          <Radio.Group
                              onChange={(e) =>
                                  setAnswers((prev) => ({
                                      ...prev,
                                      isDirected: e.target.value,
                                  }))
                              }
                              value={answers.isDirected}
                          >
                              <Radio value="y">Yes</Radio>
                              <Radio value="n">No</Radio>
                          </Radio.Group>

                      </Form.Item>


                  </Form>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Button onClick={handleBack}>Back</Button>
                      <Button type="primary" onClick={handleUpload} disabled={!(answers.isEdgeList && answers.isDirected)}>
                          Upload
                      </Button>
                  </div>
              </div>
          )}
      </Modal>
  );
};

export default HadoopUploadModal;
