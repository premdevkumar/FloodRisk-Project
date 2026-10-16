package com.floodmanagement.api.web3;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;

@Configuration
public class Web3jConfig {

    @Value("${web3.node-url:https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID}")
    private String nodeUrl;

    @Value("${web3.private-key:0x4c0883a69102937d6231471b5dbb6204f29139fa314087380f13540000000000}")
    private String privateKey;

    @Bean
    public Web3j web3j() {
        return Web3j.build(new HttpService(nodeUrl));
    }

    @Bean
    public Credentials credentials() {
        return Credentials.create(privateKey);
    }
}
