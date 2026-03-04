import { callDeepSeek } from '@/lib/deepseek';
import { retrieveSnippets } from '@/lib/knowledge';
import {
  AgentStep,
  DataDictionary,
  FileTreeNode,
  MappingReport,
  MigrationIR,
  MigrationResult,
  ParsedStructure,
  ProjectModel
} from '@/types/migration';

const lines = (text: string) => text.split('\n');

const buildSpringFiles = (ir: MigrationIR, dictionary: DataDictionary, mapping: MappingReport): Record<string, string> => ({
  'pom.xml': `<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">\n  <modelVersion>4.0.0</modelVersion>\n  <groupId>com.demo</groupId>\n  <artifactId>migrationstudio</artifactId>\n  <version>0.0.1-SNAPSHOT</version>\n  <properties><java.version>17</java.version></properties>\n  <dependencies>\n    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId></dependency>\n    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-data-jpa</artifactId></dependency>\n    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-validation</artifactId></dependency>\n    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-test</artifactId><scope>test</scope></dependency>\n  </dependencies>\n</project>`,
  'src/main/java/com/demo/migrationstudio/MigrationStudioApplication.java': `package com.demo.migrationstudio;\n\nimport org.springframework.boot.SpringApplication;\nimport org.springframework.boot.autoconfigure.SpringBootApplication;\n\n@SpringBootApplication\npublic class MigrationStudioApplication {\n  public static void main(String[] args) {\n    SpringApplication.run(MigrationStudioApplication.class, args);\n  }\n}`,
  'src/main/java/com/demo/migrationstudio/api/controller/CustomerInquiryController.java': `package com.demo.migrationstudio.api.controller;\n\nimport com.demo.migrationstudio.api.dto.CustomerInquiryRequest;\nimport com.demo.migrationstudio.api.dto.CustomerInquiryResponse;\nimport com.demo.migrationstudio.application.CustomerInquiryUseCase;\nimport jakarta.validation.Valid;\nimport org.springframework.web.bind.annotation.*;\n\n@RestController\n@RequestMapping(\"/api/customers\")\npublic class CustomerInquiryController {\n  private final CustomerInquiryUseCase useCase;\n  public CustomerInquiryController(CustomerInquiryUseCase useCase){this.useCase = useCase;}\n\n  @PostMapping(\"/inquiry\")\n  public CustomerInquiryResponse inquire(@Valid @RequestBody CustomerInquiryRequest request){\n    return useCase.handle(request);\n  }\n}`,
  'src/main/java/com/demo/migrationstudio/api/dto/CustomerInquiryRequest.java': `package com.demo.migrationstudio.api.dto;\n\nimport jakarta.validation.constraints.NotNull;\n\npublic record CustomerInquiryRequest(@NotNull Long customerNo) {}`,
  'src/main/java/com/demo/migrationstudio/api/dto/CustomerInquiryResponse.java': `package com.demo.migrationstudio.api.dto;\n\npublic record CustomerInquiryResponse(Long customerNo, String customerName, String riskFlag) {}`,
  'src/main/java/com/demo/migrationstudio/api/error/ApiError.java': `package com.demo.migrationstudio.api.error;\n\npublic record ApiError(String code, String message) {}`,
  'src/main/java/com/demo/migrationstudio/api/error/GlobalExceptionHandler.java': `package com.demo.migrationstudio.api.error;\n\nimport com.demo.migrationstudio.domain.exception.DomainException;\nimport org.springframework.http.HttpStatus;\nimport org.springframework.http.ResponseEntity;\nimport org.springframework.web.bind.annotation.ExceptionHandler;\nimport org.springframework.web.bind.annotation.RestControllerAdvice;\n\n@RestControllerAdvice\npublic class GlobalExceptionHandler {\n  @ExceptionHandler(DomainException.class)\n  public ResponseEntity<ApiError> handleDomain(DomainException ex){\n    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiError(\"DOMAIN_ERROR\", ex.getMessage()));\n  }\n}`,
  'src/main/java/com/demo/migrationstudio/application/CustomerInquiryUseCase.java': `package com.demo.migrationstudio.application;\n\nimport com.demo.migrationstudio.api.dto.CustomerInquiryRequest;\nimport com.demo.migrationstudio.api.dto.CustomerInquiryResponse;\nimport com.demo.migrationstudio.domain.model.Customer;\nimport com.demo.migrationstudio.domain.service.CustomerDomainService;\nimport org.springframework.stereotype.Service;\nimport org.springframework.transaction.annotation.Transactional;\n\n@Service\npublic class CustomerInquiryUseCase {\n  private final CustomerDomainService domainService;\n  public CustomerInquiryUseCase(CustomerDomainService domainService){this.domainService = domainService;}\n\n  @Transactional(readOnly = true)\n  public CustomerInquiryResponse handle(CustomerInquiryRequest request){\n    Customer customer = domainService.findByCustomerNumber(request.customerNo());\n    return new CustomerInquiryResponse(customer.customerNo(), customer.customerName(), customer.riskFlag());\n  }\n}`,
  'src/main/java/com/demo/migrationstudio/domain/model/Customer.java': `package com.demo.migrationstudio.domain.model;\n\npublic record Customer(Long customerNo, String customerName, String riskFlag) {}`,
  'src/main/java/com/demo/migrationstudio/domain/service/CustomerDomainService.java': `package com.demo.migrationstudio.domain.service;\n\nimport com.demo.migrationstudio.domain.exception.DomainException;\nimport com.demo.migrationstudio.domain.model.Customer;\nimport com.demo.migrationstudio.infrastructure.jpa.entity.CustomerEntity;\nimport com.demo.migrationstudio.infrastructure.jpa.repo.CustomerRepository;\nimport org.springframework.stereotype.Service;\n\n@Service\npublic class CustomerDomainService {\n  private final CustomerRepository repository;\n  public CustomerDomainService(CustomerRepository repository){this.repository = repository;}\n\n  public Customer findByCustomerNumber(Long customerNo){\n    CustomerEntity e = repository.findById(customerNo).orElseThrow(() -> new DomainException(\"Customer not found\"));\n    return new Customer(e.getCustomerNo(), e.getCustomerName(), e.getRiskFlag());\n  }\n}`,
  'src/main/java/com/demo/migrationstudio/domain/exception/DomainException.java': `package com.demo.migrationstudio.domain.exception;\n\npublic class DomainException extends RuntimeException {\n  public DomainException(String message){super(message);}\n}`,
  'src/main/java/com/demo/migrationstudio/infrastructure/jpa/entity/CustomerEntity.java': `package com.demo.migrationstudio.infrastructure.jpa.entity;\n\nimport jakarta.persistence.Entity;\nimport jakarta.persistence.Id;\n\n@Entity\npublic class CustomerEntity {\n  @Id\n  private Long customerNo;\n  private String customerName;\n  private String riskFlag;\n  public Long getCustomerNo(){return customerNo;}\n  public String getCustomerName(){return customerName;}\n  public String getRiskFlag(){return riskFlag;}\n}`,
  'src/main/java/com/demo/migrationstudio/infrastructure/jpa/repo/CustomerRepository.java': `package com.demo.migrationstudio.infrastructure.jpa.repo;\n\nimport com.demo.migrationstudio.infrastructure.jpa.entity.CustomerEntity;\nimport org.springframework.data.jpa.repository.JpaRepository;\n\npublic interface CustomerRepository extends JpaRepository<CustomerEntity, Long> {}`,
  'src/test/java/com/demo/migrationstudio/CustomerInquiryUseCaseTest.java': `package com.demo.migrationstudio;\n\nimport org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.assertTrue;\n\nclass CustomerInquiryUseCaseTest {\n  @Test\n  void smoke(){\n    assertTrue(true);\n  }\n}`,
  'docs/IR.json': JSON.stringify(ir, null, 2),
  'docs/data-dictionary.json': JSON.stringify(dictionary, null, 2),
  'docs/mapping-report.json': JSON.stringify(mapping, null, 2),
  'docs/risk-register.md': `# Risk Register\n\n- Assumption: CHAIN maps to a primary key lookup without composite keys.\n- Uncertainty: RPG indicators could imply hidden business rules not captured in source.\n- Risk: Decimal precision mismatches when translating packed fields.\n- Mitigation: Add reconciliation tests and SME review checkpoints.`,
  'docs/reconciliation-report.md': `# Reconciliation Report Template\n\n## Scope\nCompare RPG outputs against Spring Boot outputs for customer inquiry scenarios.\n\n## Test Cases\n- Existing customer number returns profile fields.\n- Missing customer returns domain error.\n\n## Result Matrix\n| Case | RPG Result | Spring Result | Match | Notes |\n|---|---|---|---|---|\n| TC-01 | | | | |\n| TC-02 | | | | |`,
  'README.md': `# RPG → Spring Boot Migration Studio\n\nThis demo shows an agentic modernization pipeline that transforms RPG source into layered Spring Boot artifacts.\n\n## Run\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## DeepSeek Configuration\nCreate a .env.local file:\n\n\`\`\`bash\nDEEPSEEK_API_KEY=your_key_here\n\`\`\`\n\nWithout an API key, the app uses deterministic mock mode while preserving the same pipeline contracts.\n`
});

const buildTree = (filesMap: Record<string, string>): FileTreeNode[] => {
  const root: FileTreeNode = { name: '/', path: '/', type: 'folder', children: [] };
  Object.keys(filesMap).forEach((path) => {
    const parts = path.split('/');
    let current = root;
    let accumulated = '';
    parts.forEach((part, index) => {
      accumulated = accumulated ? `${accumulated}/${part}` : part;
      const isFile = index === parts.length - 1;
      if (!current.children) current.children = [];
      let existing = current.children.find((node) => node.name === part);
      if (!existing) {
        existing = { name: part, path: accumulated, type: isFile ? 'file' : 'folder', children: isFile ? undefined : [] };
        current.children.push(existing);
      }
      current = existing;
    });
  });
  return root.children ?? [];
};

export async function runMigration(rpgSource: string): Promise<MigrationResult> {
  const rawLines = lines(rpgSource);

  const parserPrompt = `Agent: RPG Parser\nInput RPG:\n${rpgSource}\nReturn JSON with sections/procedures/fileOps/fields/screenReferences/sourceTrace.`;
  const parsedRes = await callDeepSeek<ParsedStructure>({ prompt: parserPrompt }, () => ({
    sections: ['Header', 'File Definitions', 'Data Definitions', 'Calculation Specs'],
    procedures: ['*ENTRY'],
    fileOps: [{ op: 'CHAIN', target: 'CBANKPF', line: 8 }],
    fields: ['CustomerNo', 'CustomerName', 'RiskFlag'],
    screenReferences: [],
    sourceTrace: [
      { source: 'CHAIN operation', startLine: 8, endLine: 8, note: 'Record lookup' },
      { source: 'Projection assignments', startLine: 10, endLine: 11, note: 'Output mapping' }
    ],
    ragEvidence: retrieveSnippets('CHAIN PF')
  }));

  const irPrompt = `Agent: IR Builder\nParsed Input:\n${JSON.stringify(parsedRes.output)}\nGenerate migration IR in JSON.`;
  const irRes = await callDeepSeek<MigrationIR>({ prompt: irPrompt }, () => ({
    entities: ['Customer'],
    operations: ['CustomerInquiry'],
    endpointCandidates: ['POST /api/customers/inquiry'],
    validations: ['customerNo required', 'customerNo numeric'],
    transactionHints: ['readOnly transaction for inquiry'],
    sourceTrace: parsedRes.output.sourceTrace,
    ragEvidence: retrieveSnippets('CHAIN DSPF SRVPGM')
  }));

  const dictRes = await callDeepSeek<DataDictionary>(
    { prompt: `Agent: Data Dictionary Generator\nInput IR:\n${JSON.stringify(irRes.output)}` },
    () => ({
      fields: [
        {
          name: 'customerNo',
          type: 'Long',
          precision: '7,0',
          constraints: ['primary key', 'not null'],
          validationSuggestions: ['Bean Validation @NotNull']
        },
        {
          name: 'customerName',
          type: 'String',
          constraints: ['length <= 40'],
          validationSuggestions: ['@Size(max=40)']
        },
        {
          name: 'riskFlag',
          type: 'String',
          constraints: ['length = 1'],
          validationSuggestions: ['@Pattern for allowed values']
        }
      ],
      ragEvidence: retrieveSnippets('PF LF validation')
    })
  );

  const mappingRes = await callDeepSeek<MappingReport>(
    { prompt: `Agent: Mapping Report Generator\nInput IR:\n${JSON.stringify(irRes.output)}` },
    () => ({
      mappings: [
        { rpgSegment: 'CHAIN CBANKPF', springArtifact: 'CustomerRepository.findById', targetLayer: 'infrastructure' },
        { rpgSegment: '*ENTRY PLIST', springArtifact: 'CustomerInquiryController.inquire', targetLayer: 'api' },
        { rpgSegment: 'EVAL assignments', springArtifact: 'CustomerInquiryUseCase.handle', targetLayer: 'application' },
        { rpgSegment: 'Business checks', springArtifact: 'CustomerDomainService.findByCustomerNumber', targetLayer: 'domain' }
      ],
      ragEvidence: retrieveSnippets('CHAIN READ UPDATE DELETE')
    })
  );

  const projectRes = await callDeepSeek<ProjectModel>(
    { prompt: `Agent: Spring Boot Project Generator\nInput: IR + dictionary + mapping.\nReturn folders/files/content.` },
    () => {
      const files = buildSpringFiles(irRes.output, dictRes.output, mappingRes.output);
      return {
        folders: [...new Set(Object.keys(files).map((file) => file.split('/').slice(0, -1).join('/')).filter(Boolean))],
        files: Object.entries(files).map(([path, content]) => ({ path, content })),
        ragEvidence: retrieveSnippets('PF Entity LF Repository DSPF REST')
      };
    }
  );

  const assemblerRes = await callDeepSeek<{ filesMap: Record<string, string>; tree: FileTreeNode[]; ragEvidence: string[] }>(
    { prompt: `Agent: Code Assembler\nInput project model and emit filesMap/tree JSON.` },
    () => {
      const filesMap = projectRes.output.files.reduce<Record<string, string>>((acc, file) => {
        acc[file.path] = file.content;
        return acc;
      }, {});
      return { filesMap, tree: buildTree(filesMap), ragEvidence: retrieveSnippets('COPY SRVPGM architecture') };
    }
  );

  const steps: AgentStep[] = [
    { id: 1, name: 'RPG Parser', purpose: 'Parse RPG source into structural elements + sourceTrace.', status: 'done', input: { sourceLines: rawLines.length }, output: { ...parsedRes.output, mode: parsedRes.mode } },
    { id: 2, name: 'IR Builder', purpose: 'Build migration IR as canonical ledger.', status: 'done', input: parsedRes.output, output: { ...irRes.output, mode: irRes.mode } },
    { id: 3, name: 'Data Dictionary Generator', purpose: 'Generate field-level types, precision, and constraints.', status: 'done', input: irRes.output, output: { ...dictRes.output, mode: dictRes.mode } },
    { id: 4, name: 'Mapping Report Generator', purpose: 'Map RPG segments to Spring layered artifacts.', status: 'done', input: irRes.output, output: { ...mappingRes.output, mode: mappingRes.mode } },
    { id: 5, name: 'Spring Boot Project Generator', purpose: 'Generate layered project model and docs.', status: 'done', input: { ir: irRes.output, dictionary: dictRes.output, mapping: mappingRes.output }, output: { ...projectRes.output, mode: projectRes.mode } },
    { id: 6, name: 'Code Assembler', purpose: 'Assemble final files map and folder tree.', status: 'done', input: projectRes.output, output: { ...assemblerRes.output, mode: assemblerRes.mode } }
  ];

  return {
    steps,
    filesMap: assemblerRes.output.filesMap,
    tree: assemblerRes.output.tree
  };
}
