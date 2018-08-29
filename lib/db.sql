CREATE TABLE `User` (
  `UserId` int(11) NOT NULL AUTO_INCREMENT,
  `Email` varchar(255) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `Type` varchar(45) NOT NULL,
  `Register_Date` datetime NOT NULL,
  `Last_Login` datetime DEFAULT NULL,
  `Unique_Hash` varchar(255) NOT NULL,
  PRIMARY KEY (`UserId`),
  UNIQUE KEY `UserId_UNIQUE` (`UserId`),
  UNIQUE KEY `Email_UNIQUE` (`Email`),
  UNIQUE KEY `Unique_Hash_UNIQUE` (`Unique_Hash`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `Tag` (
  `TagId` int(11) NOT NULL AUTO_INCREMENT,
  `UserId` int(11) DEFAULT NULL,
  `Name` varchar(255) NOT NULL,
  `Show_in_Observatorio` tinyint(1) NOT NULL DEFAULT '0',
  `Creation_Date` datetime NOT NULL,
  PRIMARY KEY (`TagId`),
  UNIQUE KEY `TagId_UNIQUE` (`TagId`),
  UNIQUE KEY `UserTag` (`UserId`,`Name`),
  KEY `UserId_fk_idx` (`UserId`),
  CONSTRAINT `UserId_fk` FOREIGN KEY (`UserId`) REFERENCES `User` (`UserId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `Entity` (
  `EntityId` int(11) NOT NULL AUTO_INCREMENT,
  `Short_Name` varchar(45) NOT NULL,
  `Long_Name` varchar(255) NOT NULL,
  `Creation_Date` datetime NOT NULL,
  PRIMARY KEY (`EntityId`),
  UNIQUE KEY `EntityId_UNIQUE` (`EntityId`),
  UNIQUE KEY `Long_Name_UNIQUE` (`Long_Name`),
  UNIQUE KEY `Short_Name_UNIQUE` (`Short_Name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `Website` (
  `WebsiteId` int(11) NOT NULL AUTO_INCREMENT,
  `EntityId` int(11) DEFAULT NULL,
  `UserId` int(11) DEFAULT NULL,
  `Name` varchar(255) NOT NULL,
  `Creation_Date` datetime NOT NULL,
  PRIMARY KEY (`WebsiteId`),
  UNIQUE KEY `WebsiteId_UNIQUE` (`WebsiteId`),
  KEY `fk_Website_1_idx` (`EntityId`),
  CONSTRAINT `EntityId_fk` FOREIGN KEY (`EntityId`) REFERENCES `Entity` (`EntityId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `Domain` (
  `DomainId` int(11) NOT NULL AUTO_INCREMENT,
  `WebsiteId` int(11) NOT NULL,
  `Url` varchar(255) NOT NULL,
  `Start_Date` datetime NOT NULL,
  `End_Date` datetime DEFAULT NULL,
  `Active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`DomainId`),
  UNIQUE KEY `DomainId_UNIQUE` (`DomainId`),
  UNIQUE KEY `Url_UNIQUE` (`Url`),
  KEY `WebsiteId_fk_idx` (`WebsiteId`),
  CONSTRAINT `WebsiteId_fk` FOREIGN KEY (`WebsiteId`) REFERENCES `Website` (`WebsiteId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `Page` (
  `PageId` int(11) NOT NULL AUTO_INCREMENT,
  `DomainId` int(11) DEFAULT NULL,
  `Uri` varchar(255) NOT NULL,
  `Creation_Date` datetime NOT NULL,
  PRIMARY KEY (`PageId`),
  UNIQUE KEY `PageId_UNIQUE` (`PageId`),
  KEY `DomainId_fk_idx` (`DomainId`),
  CONSTRAINT `DomainId_fk` FOREIGN KEY (`DomainId`) REFERENCES `Domain` (`DomainId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `Evaluation` (
  `EvaluationId` int(11) NOT NULL AUTO_INCREMENT,
  `PageId` int(11) NOT NULL,
  `Title` varchar(255) DEFAULT NULL,
  `Score` decimal(4,1) NOT NULL,
  `Pagecode` mediumtext NOT NULL,
  `Tot` text NOT NULL,
  `Nodes` mediumtext NOT NULL,
  `Errors` text NOT NULL,
  `A` int(11) NOT NULL,
  `AA` int(11) NOT NULL,
  `AAA` int(11) NOT NULL,
  `Evaluation_Date` datetime NOT NULL,
  `Evaluationcol` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`EvaluationId`),
  UNIQUE KEY `EvalautionId_UNIQUE` (`EvaluationId`),
  KEY `PageId_fk_idx` (`PageId`),
  CONSTRAINT `PageId_fk` FOREIGN KEY (`PageId`) REFERENCES `Page` (`PageId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `TagEntity` (
  `TagId` int(11) NOT NULL,
  `EntityId` int(11) NOT NULL,
  PRIMARY KEY (`TagId`,`EntityId`),
  UNIQUE KEY `TagEntity` (`TagId`,`EntityId`),
  KEY `EntityId_idx` (`EntityId`),
  CONSTRAINT `TEEntityId` FOREIGN KEY (`EntityId`) REFERENCES `Entity` (`EntityId`) ON DELETE CASCADE,
  CONSTRAINT `TETagId_fk` FOREIGN KEY (`TagId`) REFERENCES `Tag` (`TagId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `TagWebsite` (
  `TagId` int(11) NOT NULL,
  `WebsiteId` int(11) NOT NULL,
  PRIMARY KEY (`TagId`,`WebsiteId`),
  UNIQUE KEY `TagWebsite` (`TagId`,`WebsiteId`),
  KEY `WebsiteId_fk_idx` (`WebsiteId`),
  CONSTRAINT `TWTagId_fk` FOREIGN KEY (`TagId`) REFERENCES `Tag` (`TagId`) ON DELETE CASCADE,
  CONSTRAINT `TWWebsiteId_fk` FOREIGN KEY (`WebsiteId`) REFERENCES `Website` (`WebsiteId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `TagDomain` (
  `TagId` int(11) NOT NULL,
  `DomainId` int(11) NOT NULL,
  PRIMARY KEY (`TagId`,`DomainId`),
  UNIQUE KEY `TagDomain` (`TagId`,`DomainId`),
  KEY `TDDomainId_idx` (`DomainId`),
  CONSTRAINT `TDDomainId` FOREIGN KEY (`DomainId`) REFERENCES `Domain` (`DomainId`) ON DELETE CASCADE,
  CONSTRAINT `TDTagId_fk` FOREIGN KEY (`TagId`) REFERENCES `Tag` (`TagId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `TagPage` (
  `TagId` int(11) NOT NULL,
  `PageId` int(11) NOT NULL,
  PRIMARY KEY (`TagId`,`PageId`),
  UNIQUE KEY `TagPage` (`TagId`,`PageId`),
  KEY `TPPageId_fk_idx` (`PageId`),
  CONSTRAINT `TPPageId_fk` FOREIGN KEY (`PageId`) REFERENCES `Page` (`PageId`) ON DELETE CASCADE,
  CONSTRAINT `TPTagId_fk` FOREIGN KEY (`TagId`) REFERENCES `Tag` (`TagId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;